/**
 * Redis Cache Client
 *
 * Singleton Redis client with caching helper functions.
 * Provides graceful degradation when Redis is unavailable.
 */

import Redis from "ioredis";
import { env } from "@/env.mjs";

/**
 * Redis Cache Class
 * Manages Redis connection and provides caching utilities
 */
export class RedisCache {
  private client: Redis | null = null;
  private isConnected: boolean = false;

  constructor() {
    try {
      const redisUrl = env.REDIS_URL || "redis://localhost:6379";

      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn(
              "[Redis] Max retry attempts reached. Operating in no-cache mode."
            );
            return null; // Stop retrying
          }
          return Math.min(times * 100, 2000); // Exponential backoff
        },
        reconnectOnError: (err) => {
          const targetErrors = ["READONLY", "ECONNRESET"];
          return targetErrors.some((targetError) =>
            err.message.includes(targetError)
          );
        },
      });

      this.client.on("connect", () => {
        this.isConnected = true;
        console.log("[Redis] Connected successfully");
      });

      this.client.on("error", (err) => {
        this.isConnected = false;
        console.warn("[Redis] Connection error:", err.message);
        console.warn("[Redis] Operating in no-cache mode");
      });

      this.client.on("close", () => {
        this.isConnected = false;
        console.warn("[Redis] Connection closed");
      });
    } catch (error) {
      console.warn(
        "[Redis] Failed to initialize. Operating in no-cache mode:",
        error
      );
      this.client = null;
      this.isConnected = false;
    }
  }

  /**
   * Check if Redis is connected
   */
  isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get cached data
   *
   * @param key - Cache key
   * @returns Cached data or null if not found/unavailable
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const data = await this.client!.get(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data) as T;
    } catch (error) {
      console.warn(`[Redis] Failed to get key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set cached data with TTL
   *
   * @param key - Cache key
   * @param value - Data to cache
   * @param ttlSeconds - Time to live in seconds
   */
  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    if (!this.isAvailable()) {
      return; // Silently fail if Redis unavailable
    }

    try {
      const serialized = JSON.stringify(value);
      await this.client!.setex(key, ttlSeconds, serialized);
    } catch (error) {
      console.warn(`[Redis] Failed to set key "${key}":`, error);
    }
  }

  /**
   * Delete cached data
   *
   * @param key - Cache key
   */
  async del(key: string): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.client!.del(key);
    } catch (error) {
      console.warn(`[Redis] Failed to delete key "${key}":`, error);
    }
  }

  /**
   * Increment a counter
   *
   * @param key - Counter key
   * @returns New counter value or null if unavailable
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      return await this.client!.incr(key);
    } catch (error) {
      console.warn(`[Redis] Failed to increment key "${key}":`, error);
      return null;
    }
  }

  /**
   * Set expiration on a key
   *
   * @param key - Key to expire
   * @param seconds - Seconds until expiration
   */
  async expire(key: string, seconds: number): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      await this.client!.expire(key, seconds);
    } catch (error) {
      console.warn(`[Redis] Failed to set expiration on key "${key}":`, error);
    }
  }

  /**
   * Get multiple keys at once
   *
   * @param keys - Array of cache keys
   * @returns Array of cached data (null for missing keys)
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.isAvailable() || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      const values = await this.client!.mget(...keys);
      return values.map((value) => (value ? JSON.parse(value) as T : null));
    } catch (error) {
      console.warn("[Redis] Failed to mget:", error);
      return keys.map(() => null);
    }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        console.log("[Redis] Disconnected successfully");
      } catch (error) {
        console.warn("[Redis] Error during disconnect:", error);
      }
    }
  }
}

// Singleton instance
export const redis = new RedisCache();

/**
 * Cache Wrapper Helper
 *
 * Wraps a fetcher function with caching logic.
 * Checks cache first, calls fetcher on miss, and caches result.
 *
 * @param key - Cache key
 * @param ttlSeconds - Time to live in seconds
 * @param fetcher - Function that fetches data
 * @returns Object with data and cached flag
 *
 * @example
 * const { data, cached } = await withCache(
 *   'user:123',
 *   300,
 *   async () => await fetchUser(123)
 * );
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<{ data: T; cached: boolean }> {
  // Try to get from cache first
  const cachedData = await redis.get<T>(key);
  if (cachedData !== null) {
    return { data: cachedData, cached: true };
  }

  // Cache miss - fetch data
  const data = await fetcher();

  // Cache the result (fire and forget)
  redis.set(key, data, ttlSeconds).catch((err) => {
    console.warn(`[Redis] Failed to cache after fetch for key "${key}":`, err);
  });

  return { data, cached: false };
}

/**
 * Cache Circuit Breaker
 *
 * Tracks consecutive failures and serves stale cache when threshold exceeded.
 */
export class CacheCircuitBreaker {
  private failureKey: string;
  private threshold: number;
  private cooldownSeconds: number;

  constructor(
    name: string,
    threshold: number = 5,
    cooldownSeconds: number = 300
  ) {
    this.failureKey = `circuit:${name}:failures`;
    this.threshold = threshold;
    this.cooldownSeconds = cooldownSeconds;
  }

  /**
   * Record a failure
   */
  async recordFailure(): Promise<void> {
    const count = await redis.incr(this.failureKey);
    if (count === 1) {
      // Set expiration on first failure
      await redis.expire(this.failureKey, this.cooldownSeconds);
    }
  }

  /**
   * Reset failure counter
   */
  async reset(): Promise<void> {
    await redis.del(this.failureKey);
  }

  /**
   * Check if circuit is open (too many failures)
   */
  async isOpen(): Promise<boolean> {
    const failures = await redis.get<number>(this.failureKey);
    return failures !== null && failures >= this.threshold;
  }

  /**
   * Get current failure count
   */
  async getFailureCount(): Promise<number> {
    const failures = await redis.get<number>(this.failureKey);
    return failures || 0;
  }
}

/**
 * Get or refresh stale cache
 *
 * Returns stale cache if circuit is open, otherwise fetches fresh data
 *
 * @param key - Cache key
 * @param ttlSeconds - TTL for fresh data
 * @param circuitBreaker - Circuit breaker instance
 * @param fetcher - Function to fetch fresh data
 * @returns Data with stale flag
 */
export async function getOrStale<T>(
  key: string,
  ttlSeconds: number,
  circuitBreaker: CacheCircuitBreaker,
  fetcher: () => Promise<T>
): Promise<{ data: T; stale: boolean }> {
  const isCircuitOpen = await circuitBreaker.isOpen();

  if (isCircuitOpen) {
    // Circuit open - serve stale cache
    const staleData = await redis.get<T>(key);
    if (staleData !== null) {
      console.warn("[Cache] Circuit open, serving stale cache");
      return { data: staleData, stale: true };
    }
  }

  try {
    // Try to fetch fresh data
    const data = await fetcher();
    await redis.set(key, data, ttlSeconds);
    await circuitBreaker.reset(); // Reset on success
    return { data, stale: false };
  } catch (error) {
    await circuitBreaker.recordFailure();

    // If fetch failed, try stale cache as last resort
    const staleData = await redis.get<T>(key);
    if (staleData !== null) {
      console.warn("[Cache] Fetch failed, serving stale cache");
      return { data: staleData, stale: true };
    }

    throw error; // No stale cache available, propagate error
  }
}

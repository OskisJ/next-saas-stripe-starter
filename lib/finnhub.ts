/**
 * Finnhub API Client
 *
 * Server-only wrapper for Finnhub API with:
 * - Retry logic with exponential backoff
 * - Error handling and custom error types
 * - Mock mode for development without API key
 * - Type-safe responses with Zod validation
 */

"use server";

import { env } from "@/env.mjs";
import {
  companyProfileSchema,
  stockMetricsSchema,
  candleDataSchema,
  socialSentimentSchema,
  recommendationSchema,
  type CompanyProfile,
  type StockMetrics,
  type CandleData,
  type SocialSentiment,
  type Recommendation,
} from "./validations/stock";
import { getMockData } from "./finnhub-mock-data";

/**
 * Custom Finnhub Error Class
 */
export class FinnhubError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = "FinnhubError";
  }
}

/**
 * Finnhub Client Configuration
 */
export interface FinnhubConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  userAgent: string;
}

const defaultConfig: FinnhubConfig = {
  apiKey: env.FINNHUB_API_KEY,
  baseUrl: "https://finnhub.io/api/v1",
  timeout: 10000, // 10 seconds
  userAgent: "NextJS-Stock-Dashboard/1.0",
};

/**
 * Check if running in mock mode
 */
function isMockMode(): boolean {
  return !env.FINNHUB_API_KEY || env.FINNHUB_API_KEY === "mock";
}

/**
 * Delay helper for mock mode
 */
function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 500));
}

/**
 * Retry with exponential backoff
 *
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 100)
 * @returns Result from function
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx except 429)
      if (error instanceof FinnhubError) {
        if (
          error.statusCode &&
          error.statusCode >= 400 &&
          error.statusCode < 500 &&
          error.statusCode !== 429
        ) {
          throw error; // Don't retry client errors
        }
      }

      // Don't retry on last attempt
      if (attempt === maxRetries - 1) {
        break;
      }

      // Exponential backoff: 100ms, 200ms, 400ms
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `[Finnhub] Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error("Max retries exceeded");
}

/**
 * Make HTTP request to Finnhub API
 *
 * @param endpoint - API endpoint (e.g., "/stock/profile2")
 * @param params - Query parameters
 * @param config - Client configuration
 * @returns Parsed JSON response
 */
async function fetchFromFinnhub(
  endpoint: string,
  params: Record<string, string> = {},
  config: FinnhubConfig = defaultConfig
): Promise<any> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const url = new URL(endpoint, config.baseUrl);
    url.searchParams.append("token", config.apiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": config.userAgent,
        "Content-Type": "application/json",
      },
    });

    clearTimeout(timeoutId);

    // Handle HTTP errors
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");

      if (response.status === 404) {
        throw new FinnhubError(
          "SYMBOL_NOT_FOUND",
          "Ticker symbol not found on Finnhub",
          404,
          { endpoint, params }
        );
      }

      if (response.status === 429) {
        throw new FinnhubError(
          "RATE_LIMIT_EXCEEDED",
          "Finnhub API rate limit exceeded",
          429,
          { retryAfter: response.headers.get("Retry-After") || 60 }
        );
      }

      if (response.status >= 500) {
        throw new FinnhubError(
          "FINNHUB_ERROR",
          `Finnhub server error: ${response.status}`,
          response.status,
          { errorText }
        );
      }

      throw new FinnhubError(
        "API_ERROR",
        `Finnhub API error: ${response.status}`,
        response.status,
        { errorText }
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle abort/timeout
    if (error instanceof Error && error.name === "AbortError") {
      throw new FinnhubError(
        "TIMEOUT",
        "Request to Finnhub timed out",
        undefined,
        { timeout: config.timeout }
      );
    }

    // Handle network errors
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new FinnhubError(
        "NETWORK_ERROR",
        "Network error connecting to Finnhub",
        undefined,
        { originalError: error.message }
      );
    }

    throw error;
  }
}

/**
 * Finnhub Client Class
 */
export class FinnhubClient {
  private config: FinnhubConfig;

  constructor(config?: Partial<FinnhubConfig>) {
    this.config = { ...defaultConfig, ...config };

    if (isMockMode()) {
      console.warn("[Finnhub] Running in mock mode - using canned data");
    }
  }

  /**
   * Get company profile
   *
   * @param symbol - Stock ticker symbol
   * @returns Company profile data
   */
  async getProfile(symbol: string): Promise<CompanyProfile> {
    if (isMockMode()) {
      await mockDelay();
      const mockData = getMockData(symbol);
      return companyProfileSchema.parse(mockData.profile);
    }

    return retryWithBackoff(async () => {
      const data = await fetchFromFinnhub("/stock/profile2", {
        symbol: symbol.toUpperCase(),
      });

      // Validate and parse response
      return companyProfileSchema.parse(data);
    });
  }

  /**
   * Get stock metrics (fundamentals)
   *
   * @param symbol - Stock ticker symbol
   * @returns Stock metrics data
   */
  async getMetrics(symbol: string): Promise<StockMetrics> {
    if (isMockMode()) {
      await mockDelay();
      const mockData = getMockData(symbol);
      return stockMetricsSchema.parse(mockData.metrics);
    }

    return retryWithBackoff(async () => {
      const data = await fetchFromFinnhub("/stock/metric", {
        symbol: symbol.toUpperCase(),
        metric: "all",
      });

      return stockMetricsSchema.parse(data);
    });
  }

  /**
   * Get price candles (historical prices)
   *
   * @param params - Query parameters
   * @returns Candle data
   */
  async getCandles(params: {
    symbol: string;
    resolution: string;
    from: number;
    to: number;
  }): Promise<CandleData> {
    if (isMockMode()) {
      await mockDelay();
      const mockData = getMockData(params.symbol);
      return candleDataSchema.parse(mockData.candles);
    }

    return retryWithBackoff(async () => {
      const data = await fetchFromFinnhub("/stock/candle", {
        symbol: params.symbol.toUpperCase(),
        resolution: params.resolution,
        from: params.from.toString(),
        to: params.to.toString(),
      });

      const validated = candleDataSchema.parse(data);

      // Check if no data returned
      if (validated.s === "no_data") {
        throw new FinnhubError(
          "NO_DATA",
          "No price data available for this symbol and time range",
          404,
          { params }
        );
      }

      return validated;
    });
  }

  /**
   * Get social sentiment
   *
   * @param params - Query parameters
   * @returns Social sentiment data
   */
  async getSocialSentiment(params: {
    symbol: string;
    from: string;
    to: string;
  }): Promise<SocialSentiment> {
    if (isMockMode()) {
      await mockDelay();
      const mockData = getMockData(params.symbol);
      return socialSentimentSchema.parse(mockData.sentiment);
    }

    return retryWithBackoff(async () => {
      const data = await fetchFromFinnhub("/stock/social-sentiment", {
        symbol: params.symbol.toUpperCase(),
        from: params.from,
        to: params.to,
      });

      return socialSentimentSchema.parse(data);
    });
  }

  /**
   * Get analyst recommendations
   *
   * @param symbol - Stock ticker symbol
   * @returns Array of recommendations
   */
  async getRecommendations(symbol: string): Promise<Recommendation[]> {
    if (isMockMode()) {
      await mockDelay();
      const mockData = getMockData(symbol);
      return mockData.recommendations.map((rec) =>
        recommendationSchema.parse(rec)
      );
    }

    return retryWithBackoff(async () => {
      const data = await fetchFromFinnhub("/stock/recommendation", {
        symbol: symbol.toUpperCase(),
      });

      // Data is an array
      if (!Array.isArray(data) || data.length === 0) {
        // Return default recommendation if none available
        return [
          {
            buy: 0,
            hold: 0,
            sell: 0,
            strongBuy: 0,
            strongSell: 0,
            period: new Date().toISOString().split("T")[0],
            symbol: symbol.toUpperCase(),
          },
        ];
      }

      return data.map((item) => recommendationSchema.parse(item));
    });
  }

  /**
   * Get quote (current price)
   *
   * @param symbol - Stock ticker symbol
   * @returns Quote data
   */
  async getQuote(symbol: string): Promise<{
    c: number; // Current price
    h: number; // High price of the day
    l: number; // Low price of the day
    o: number; // Open price of the day
    pc: number; // Previous close price
    t: number; // Timestamp
  }> {
    if (isMockMode()) {
      await mockDelay();
      const mockData = getMockData(symbol);
      const lastPrice = mockData.candles.c[mockData.candles.c.length - 1];
      const prevPrice = mockData.candles.c[mockData.candles.c.length - 2];

      return {
        c: lastPrice,
        h: lastPrice + 2,
        l: lastPrice - 2,
        o: lastPrice - 0.5,
        pc: prevPrice,
        t: Math.floor(Date.now() / 1000),
      };
    }

    return retryWithBackoff(async () => {
      const data = await fetchFromFinnhub("/quote", {
        symbol: symbol.toUpperCase(),
      });

      return data;
    });
  }
}

// Singleton instance
export const finnhub = new FinnhubClient();

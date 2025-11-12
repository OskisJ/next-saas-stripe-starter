import { describe, it, expect } from "vitest";
import { calculateEMA, calculateMACD, calculateRSI } from "../stockUtils";

describe("stockUtils", () => {
  describe("calculateEMA", () => {
    it("should calculate EMA correctly for a simple series", () => {
      const data = [44, 45, 46, 47, 48];
      const period = 3;
      const result = calculateEMA(data, period);

      expect(result).toHaveLength(data.length);
      expect(result[0]).toBeCloseTo(45, 1); // First value is SMA
      expect(result[result.length - 1]).toBeGreaterThan(result[0]); // Trending up
    });

    it("should return empty array for empty input", () => {
      const result = calculateEMA([], 3);
      expect(result).toEqual([]);
    });

    it("should return single value for single input", () => {
      const result = calculateEMA([100], 3);
      expect(result).toEqual([100]);
    });

    it("should handle period larger than data length", () => {
      const data = [1, 2, 3];
      const result = calculateEMA(data, 10);
      expect(result).toHaveLength(data.length);
    });
  });

  describe("calculateMACD", () => {
    it("should calculate MACD with correct array lengths", () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i * 0.5);
      const result = calculateMACD(prices, 12, 26, 9);

      expect(result.macd).toHaveLength(prices.length);
      expect(result.signal).toHaveLength(prices.length);
      expect(result.histogram).toHaveLength(prices.length);
    });

    it("should calculate histogram as macd - signal", () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + Math.sin(i) * 5);
      const result = calculateMACD(prices, 12, 26, 9);

      // Check histogram calculation for a few points
      for (let i = 26; i < prices.length; i++) {
        const expectedHistogram = result.macd[i] - result.signal[i];
        expect(result.histogram[i]).toBeCloseTo(expectedHistogram, 5);
      }
    });

    it("should return zeros for insufficient data", () => {
      const prices = [100, 101, 102]; // Too few data points
      const result = calculateMACD(prices, 12, 26, 9);

      expect(result.macd).toHaveLength(prices.length);
      expect(result.macd.every((v) => v === 0)).toBe(true);
    });

    it("should return empty arrays for empty input", () => {
      const result = calculateMACD([], 12, 26, 9);

      expect(result.macd).toEqual([]);
      expect(result.signal).toEqual([]);
      expect(result.histogram).toEqual([]);
    });

    it("should work with custom periods", () => {
      const prices = Array.from({ length: 50 }, (_, i) => 100 + i);
      const result = calculateMACD(prices, 5, 10, 3);

      expect(result.macd).toHaveLength(prices.length);
      expect(result.signal).toHaveLength(prices.length);
      expect(result.histogram).toHaveLength(prices.length);
    });
  });

  describe("calculateRSI", () => {
    it("should calculate RSI for a price series", () => {
      const prices = [44, 45, 46, 47, 48, 47, 46, 45, 44, 43, 44, 45, 46, 47, 48];
      const result = calculateRSI(prices, 14);

      expect(result).toHaveLength(prices.length);
      // RSI values should be between 0 and 100
      result.forEach((rsi) => {
        expect(rsi).toBeGreaterThanOrEqual(0);
        expect(rsi).toBeLessThanOrEqual(100);
      });
    });

    it("should return neutral RSI for insufficient data", () => {
      const prices = [100, 101, 102];
      const result = calculateRSI(prices, 14);

      expect(result).toHaveLength(prices.length);
      expect(result.every((v) => v === 50)).toBe(true);
    });
  });
});

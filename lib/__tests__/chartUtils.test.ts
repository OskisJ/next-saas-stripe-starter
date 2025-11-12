import { describe, it, expect } from "vitest";
import {
  normalizeToScale,
  formatLargeNumber,
  formatMarketCap,
  formatCurrency,
  formatPercentage,
  calculatePercentageChange,
  alignTimeSeries,
  convertToCSV,
} from "../chartUtils";

describe("chartUtils", () => {
  describe("normalizeToScale", () => {
    it("should normalize to 0-1 scale", () => {
      const data = [0, 50, 100];
      const result = normalizeToScale(data);

      expect(result).toEqual([0, 0.5, 1]);
    });

    it("should handle negative values", () => {
      const data = [-10, 0, 10];
      const result = normalizeToScale(data);

      expect(result).toEqual([0, 0.5, 1]);
    });

    it("should return 0.5 for all same values", () => {
      const data = [5, 5, 5, 5];
      const result = normalizeToScale(data);

      expect(result).toEqual([0.5, 0.5, 0.5, 0.5]);
    });

    it("should return empty array for empty input", () => {
      const result = normalizeToScale([]);
      expect(result).toEqual([]);
    });

    it("should accept custom min and max", () => {
      const data = [25, 50, 75];
      const result = normalizeToScale(data, 0, 100);

      expect(result).toEqual([0.25, 0.5, 0.75]);
    });
  });

  describe("formatLargeNumber", () => {
    it("should format thousands with K", () => {
      expect(formatLargeNumber(1234)).toBe("1.2K");
      expect(formatLargeNumber(9999)).toBe("10.0K");
    });

    it("should format millions with M", () => {
      expect(formatLargeNumber(1234567)).toBe("1.2M");
      expect(formatLargeNumber(9876543)).toBe("9.9M");
    });

    it("should format billions with B", () => {
      expect(formatLargeNumber(1234567890)).toBe("1.2B");
      expect(formatLargeNumber(145200000000)).toBe("145.2B");
    });

    it("should format trillions with T", () => {
      expect(formatLargeNumber(2800000000000)).toBe("2.8T");
    });

    it("should handle small numbers", () => {
      expect(formatLargeNumber(123)).toBe("123");
      expect(formatLargeNumber(0)).toBe("0");
    });

    it("should handle negative numbers", () => {
      expect(formatLargeNumber(-1234567)).toBe("-1.2M");
    });
  });

  describe("formatMarketCap", () => {
    it("should prepend $ to formatted number", () => {
      expect(formatMarketCap(2800000000000)).toBe("$2.8T");
      expect(formatMarketCap(145200000000)).toBe("$145.2B");
    });
  });

  describe("formatCurrency", () => {
    it("should format currency with $ and decimals", () => {
      expect(formatCurrency(1234.56)).toBe("$1,234.56");
      expect(formatCurrency(1000000)).toBe("$1,000,000.00");
    });

    it("should handle custom decimal places", () => {
      expect(formatCurrency(1234.567, 3)).toBe("$1,234.567");
    });
  });

  describe("formatPercentage", () => {
    it("should format decimal as percentage", () => {
      expect(formatPercentage(0.0523)).toBe("5.23%");
      expect(formatPercentage(0.5)).toBe("50.00%");
    });

    it("should handle negative percentages", () => {
      expect(formatPercentage(-0.0234)).toBe("-2.34%");
    });

    it("should support custom decimal places", () => {
      expect(formatPercentage(0.123456, 4)).toBe("12.3456%");
    });
  });

  describe("calculatePercentageChange", () => {
    it("should calculate positive change", () => {
      const result = calculatePercentageChange(100, 105);
      expect(result).toBeCloseTo(0.05, 5);
    });

    it("should calculate negative change", () => {
      const result = calculatePercentageChange(100, 95);
      expect(result).toBeCloseTo(-0.05, 5);
    });

    it("should handle zero old value", () => {
      const result = calculatePercentageChange(0, 50);
      expect(result).toBe(1);
    });

    it("should return zero for no change", () => {
      const result = calculatePercentageChange(100, 100);
      expect(result).toBe(0);
    });
  });

  describe("alignTimeSeries", () => {
    it("should align overlapping series", () => {
      const series1 = {
        timestamps: [1, 2, 3, 4, 5],
        values: [10, 20, 30, 40, 50],
      };
      const series2 = {
        timestamps: [2, 3, 4, 5, 6],
        values: [15, 25, 35, 45, 55],
      };

      const result = alignTimeSeries(series1, series2);

      expect(result.timestamps).toEqual([2, 3, 4, 5]);
      expect(result.series1Values).toEqual([20, 30, 40, 50]);
      expect(result.series2Values).toEqual([15, 25, 35, 45]);
    });

    it("should return empty for non-overlapping series", () => {
      const series1 = { timestamps: [1, 2, 3], values: [10, 20, 30] };
      const series2 = { timestamps: [4, 5, 6], values: [40, 50, 60] };

      const result = alignTimeSeries(series1, series2);

      expect(result.timestamps).toEqual([]);
      expect(result.series1Values).toEqual([]);
      expect(result.series2Values).toEqual([]);
    });
  });

  describe("convertToCSV", () => {
    it("should convert to CSV format", () => {
      const headers = ["Date", "Price", "Volume"];
      const rows = [
        ["2025-01-01", "100.50", "1000000"],
        ["2025-01-02", "101.25", "1200000"],
      ];

      const result = convertToCSV(headers, rows);

      expect(result).toContain("Date,Price,Volume");
      expect(result).toContain("2025-01-01,100.50,1000000");
      expect(result).toContain("2025-01-02,101.25,1200000");
    });

    it("should escape commas in values", () => {
      const headers = ["Name", "Value"];
      const rows = [["Company, Inc.", "100"]];

      const result = convertToCSV(headers, rows);

      expect(result).toContain('"Company, Inc."');
    });
  });
});

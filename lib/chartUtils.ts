/**
 * Chart Utilities - Data transformation and formatting
 *
 * Provides functions for normalizing chart data, formatting large numbers,
 * and aligning time series for comparison charts.
 */

import { format } from "date-fns";

/**
 * Normalize array to 0-1 scale using min-max normalization
 *
 * Formula: (value - min) / (max - min)
 *
 * @param data - Array of numerical values to normalize
 * @param min - Optional minimum value (calculates from data if not provided)
 * @param max - Optional maximum value (calculates from data if not provided)
 * @returns Array of normalized values (0-1 scale)
 *
 * @example
 * normalizeToScale([0, 50, 100]) // Returns [0, 0.5, 1]
 * normalizeToScale([-10, 0, 10]) // Returns [0, 0.5, 1]
 */
export function normalizeToScale(
  data: number[],
  min?: number,
  max?: number
): number[] {
  if (data.length === 0) {
    return [];
  }

  // Calculate min and max if not provided
  const dataMin = min !== undefined ? min : Math.min(...data);
  const dataMax = max !== undefined ? max : Math.max(...data);

  // Handle edge case where all values are the same
  if (dataMin === dataMax) {
    return new Array(data.length).fill(0.5);
  }

  const range = dataMax - dataMin;

  return data.map((value) => (value - dataMin) / range);
}

/**
 * Format large numbers with suffixes (K, M, B, T)
 *
 * @param value - Numerical value to format
 * @returns Formatted string with appropriate suffix
 *
 * @example
 * formatLargeNumber(1234) // "1.2K"
 * formatLargeNumber(1234567) // "1.2M"
 * formatLargeNumber(1234567890) // "1.2B"
 * formatLargeNumber(1234567890000) // "1.2T"
 */
export function formatLargeNumber(value: number): string {
  const absValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absValue < 1000) {
    return sign + absValue.toFixed(0);
  } else if (absValue < 1_000_000) {
    return sign + (absValue / 1_000).toFixed(1) + "K";
  } else if (absValue < 1_000_000_000) {
    return sign + (absValue / 1_000_000).toFixed(1) + "M";
  } else if (absValue < 1_000_000_000_000) {
    return sign + (absValue / 1_000_000_000).toFixed(1) + "B";
  } else {
    return sign + (absValue / 1_000_000_000_000).toFixed(1) + "T";
  }
}

/**
 * Format market capitalization with $ prefix
 *
 * @param value - Market cap value
 * @returns Formatted string with $ and suffix
 *
 * @example
 * formatMarketCap(2800000000000) // "$2.8T"
 * formatMarketCap(145200000000) // "$145.2B"
 */
export function formatMarketCap(value: number): string {
  return "$" + formatLargeNumber(value);
}

/**
 * Format currency values
 *
 * @param value - Currency value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.567, 3) // "$1,234.567"
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage values
 *
 * @param value - Decimal value (e.g., 0.0523 for 5.23%)
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(0.0523) // "5.23%"
 * formatPercentage(-0.0234) // "-2.34%"
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return (value * 100).toFixed(decimals) + "%";
}

/**
 * Format Unix timestamp to readable date string
 *
 * @param timestamp - Unix timestamp (seconds)
 * @param formatType - 'short' for chart axes, 'long' for tooltips
 * @returns Formatted date string
 *
 * @example
 * formatTimestamp(1704067200, 'short') // "Jan 1"
 * formatTimestamp(1704067200, 'long') // "January 1, 2025"
 */
export function formatTimestamp(
  timestamp: number,
  formatType: "short" | "long" = "short"
): string {
  const date = new Date(timestamp * 1000); // Convert to milliseconds

  if (formatType === "short") {
    return format(date, "MMM d");
  } else {
    return format(date, "MMMM d, yyyy");
  }
}

/**
 * Format timestamp for chart tooltips with time
 *
 * @param timestamp - Unix timestamp (seconds)
 * @returns Formatted date/time string
 *
 * @example
 * formatTimestampWithTime(1704067200) // "Jan 1, 2025 12:00 PM"
 */
export function formatTimestampWithTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return format(date, "MMM d, yyyy h:mm a");
}

/**
 * Align two time series by matching timestamps
 * Returns arrays with only matching timestamps
 *
 * @param series1 - First time series with timestamps and values
 * @param series2 - Second time series with timestamps and values
 * @returns Aligned time series with common timestamps
 *
 * @example
 * const result = alignTimeSeries(
 *   { timestamps: [1, 2, 3, 4], values: [10, 20, 30, 40] },
 *   { timestamps: [2, 3, 4, 5], values: [15, 25, 35, 45] }
 * );
 * // Returns:
 * // {
 * //   timestamps: [2, 3, 4],
 * //   series1Values: [20, 30, 40],
 * //   series2Values: [15, 25, 35]
 * // }
 */
export function alignTimeSeries(
  series1: { timestamps: number[]; values: number[] },
  series2: { timestamps: number[]; values: number[] }
): {
  timestamps: number[];
  series1Values: number[];
  series2Values: number[];
} {
  const alignedTimestamps: number[] = [];
  const alignedSeries1Values: number[] = [];
  const alignedSeries2Values: number[] = [];

  // Create a map for faster lookup
  const series2Map = new Map<number, number>();
  for (let i = 0; i < series2.timestamps.length; i++) {
    series2Map.set(series2.timestamps[i], series2.values[i]);
  }

  // Find common timestamps
  for (let i = 0; i < series1.timestamps.length; i++) {
    const timestamp = series1.timestamps[i];
    const value1 = series1.values[i];

    if (series2Map.has(timestamp)) {
      const value2 = series2Map.get(timestamp)!;
      alignedTimestamps.push(timestamp);
      alignedSeries1Values.push(value1);
      alignedSeries2Values.push(value2);
    }
  }

  return {
    timestamps: alignedTimestamps,
    series1Values: alignedSeries1Values,
    series2Values: alignedSeries2Values,
  };
}

/**
 * Calculate percentage change between two values
 *
 * @param oldValue - Starting value
 * @param newValue - Ending value
 * @returns Percentage change (decimal format, e.g., 0.05 for 5%)
 *
 * @example
 * calculatePercentageChange(100, 105) // 0.05 (5% increase)
 * calculatePercentageChange(100, 95) // -0.05 (5% decrease)
 */
export function calculatePercentageChange(
  oldValue: number,
  newValue: number
): number {
  if (oldValue === 0) {
    return newValue === 0 ? 0 : 1; // 100% change if starting from 0
  }

  return (newValue - oldValue) / oldValue;
}

/**
 * Convert chart data to CSV format for export
 *
 * @param headers - Array of column headers
 * @param rows - Array of row data (each row is an array of values)
 * @returns CSV string
 *
 * @example
 * const csv = convertToCSV(
 *   ['Date', 'Price', 'Volume'],
 *   [
 *     ['2025-01-01', '100.50', '1000000'],
 *     ['2025-01-02', '101.25', '1200000']
 *   ]
 * );
 */
export function convertToCSV(headers: string[], rows: string[][]): string {
  const csvRows = [headers.join(",")];

  for (const row of rows) {
    // Escape commas and quotes in values
    const escapedRow = row.map((value) => {
      const stringValue = String(value);
      if (stringValue.includes(",") || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    });
    csvRows.push(escapedRow.join(","));
  }

  return csvRows.join("\n");
}

/**
 * Trigger download of CSV data
 *
 * @param csvContent - CSV string content
 * @param filename - Name of the file to download
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}

/**
 * Debounce function for search inputs
 *
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Stock Utilities - EMA and MACD Calculations
 *
 * This module provides technical analysis functions for stock price data.
 * The primary indicators are:
 * - EMA (Exponential Moving Average): Weighted average that gives more importance to recent prices
 * - MACD (Moving Average Convergence Divergence): Momentum indicator showing relationship between two EMAs
 *
 * MACD Algorithm:
 * 1. Calculate fast EMA (default: 12 periods) of close prices
 * 2. Calculate slow EMA (default: 26 periods) of close prices
 * 3. MACD Line = Fast EMA - Slow EMA
 * 4. Signal Line = EMA (default: 9 periods) of MACD Line
 * 5. Histogram = MACD Line - Signal Line
 *
 * The histogram represents the divergence between MACD and signal lines.
 * Positive histogram indicates bullish momentum, negative indicates bearish.
 */

/**
 * Calculate Simple Moving Average (SMA)
 * Used as the initial EMA value for the first 'period' data points
 *
 * @param data - Array of numerical values
 * @param period - Number of periods to average
 * @returns Simple moving average
 */
function calculateSMA(data: number[], period: number): number {
  if (data.length < period) {
    return data.reduce((sum, val) => sum + val, 0) / data.length;
  }

  const slice = data.slice(0, period);
  const sum = slice.reduce((acc, val) => acc + val, 0);
  return sum / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 *
 * EMA Formula:
 * - Multiplier = 2 / (period + 1)
 * - EMA[today] = (close[today] - EMA[yesterday]) * multiplier + EMA[yesterday]
 * - EMA[first] = SMA of first 'period' values
 *
 * @param data - Array of price values
 * @param period - Number of periods for EMA calculation (e.g., 12, 26)
 * @returns Array of EMA values (same length as input)
 *
 * @example
 * const prices = [44, 45, 46, 47, 48, 49, 50];
 * const ema = calculateEMA(prices, 3);
 * // Returns EMA array with same length as prices
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) {
    return [];
  }

  if (data.length === 1) {
    return [data[0]];
  }

  if (period <= 0 || period > data.length) {
    // If period is invalid, return data as-is
    return [...data];
  }

  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  // First EMA value is SMA of first 'period' values
  const firstEMA = calculateSMA(data, period);
  ema.push(firstEMA);

  // Calculate remaining EMA values
  for (let i = 1; i < data.length; i++) {
    const currentPrice = data[i];
    const previousEMA = ema[i - 1];
    const currentEMA = (currentPrice - previousEMA) * multiplier + previousEMA;
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 *
 * MACD is a momentum indicator that shows the relationship between two moving averages.
 * It's commonly used to identify trend changes and momentum shifts.
 *
 * Default parameters (industry standard):
 * - Fast period: 12 (short-term EMA)
 * - Slow period: 26 (long-term EMA)
 * - Signal period: 9 (EMA of MACD line)
 *
 * @param closePrices - Array of closing prices
 * @param fastPeriod - Fast EMA period (default: 12)
 * @param slowPeriod - Slow EMA period (default: 26)
 * @param signalPeriod - Signal line EMA period (default: 9)
 * @returns Object containing MACD line, signal line, and histogram
 *
 * @example
 * const prices = [...]; // 50+ closing prices
 * const macd = calculateMACD(prices); // Uses default 12, 26, 9
 * console.log(macd.macd);      // MACD line values
 * console.log(macd.signal);    // Signal line values
 * console.log(macd.histogram); // Histogram (MACD - Signal)
 */
export function calculateMACD(
  closePrices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  // Handle edge cases
  if (closePrices.length === 0) {
    return { macd: [], signal: [], histogram: [] };
  }

  // Need minimum data points for meaningful MACD calculation
  // At least slowPeriod + signalPeriod (26 + 9 = 35 by default)
  const minimumDataPoints = slowPeriod + signalPeriod;
  if (closePrices.length < minimumDataPoints) {
    console.warn(
      `Insufficient data for MACD calculation. Need at least ${minimumDataPoints} data points, got ${closePrices.length}.`
    );
    // Return arrays filled with zeros to match input length
    return {
      macd: new Array(closePrices.length).fill(0),
      signal: new Array(closePrices.length).fill(0),
      histogram: new Array(closePrices.length).fill(0),
    };
  }

  // Step 1 & 2: Calculate fast and slow EMAs
  const fastEMA = calculateEMA(closePrices, fastPeriod);
  const slowEMA = calculateEMA(closePrices, slowPeriod);

  // Step 3: Calculate MACD line (fast EMA - slow EMA)
  const macdLine: number[] = [];
  for (let i = 0; i < closePrices.length; i++) {
    macdLine.push(fastEMA[i] - slowEMA[i]);
  }

  // Step 4: Calculate signal line (EMA of MACD line)
  const signalLine = calculateEMA(macdLine, signalPeriod);

  // Step 5: Calculate histogram (MACD - signal)
  const histogram: number[] = [];
  for (let i = 0; i < macdLine.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return {
    macd: macdLine,
    signal: signalLine,
    histogram: histogram,
  };
}

/**
 * Calculate RSI (Relative Strength Index)
 * Optional utility for future enhancements
 *
 * @param prices - Array of closing prices
 * @param period - RSI period (default: 14)
 * @returns Array of RSI values (0-100 scale)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (prices.length < period + 1) {
    return new Array(prices.length).fill(50); // Neutral RSI
  }

  const rsi: number[] = [];
  const changes: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 0; i < period; i++) {
    const change = changes[i];
    if (change > 0) {
      avgGain += change;
    } else {
      avgLoss += Math.abs(change);
    }
  }

  avgGain /= period;
  avgLoss /= period;

  // Calculate RSI for each subsequent period
  for (let i = period; i < changes.length; i++) {
    const change = changes[i];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - 100 / (1 + rs);
    rsi.push(rsiValue);
  }

  // Pad beginning with neutral RSI
  const padding = new Array(period + 1).fill(50);
  return [...padding, ...rsi];
}

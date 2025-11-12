/**
 * Stock Data Validation Schemas
 *
 * Zod schemas for validating stock-related data from API endpoints
 * and user inputs. Ensures type safety and data integrity.
 */

import { z } from "zod";

/**
 * Ticker Symbol Schema
 * Validates stock ticker symbols (1-5 uppercase letters)
 * Automatically converts to uppercase
 *
 * @example "AAPL", "MSFT", "GOOGL"
 */
export const tickerSymbolSchema = z
  .string()
  .min(1, "Ticker symbol is required")
  .max(5, "Ticker symbol must be 5 characters or less")
  .regex(/^[A-Z]{1,5}$/, "Invalid ticker symbol format. Use 1-5 uppercase letters.")
  .transform((s) => s.toUpperCase());

export type TickerSymbol = z.infer<typeof tickerSymbolSchema>;

/**
 * Time Range Schema
 * Valid time ranges for historical data
 */
export const rangeSchema = z
  .enum(["1D", "5D", "1M", "3M", "6M", "1Y", "5Y"])
  .default("1M");

export type TimeRange = z.infer<typeof rangeSchema>;

/**
 * Resolution Schema
 * Valid candle resolutions for price data
 */
export const resolutionSchema = z
  .enum(["1", "5", "15", "30", "60", "D", "W", "M"])
  .default("D");

export type Resolution = z.infer<typeof resolutionSchema>;

/**
 * Company Profile Schema (from Finnhub)
 * Validates company profile data returned from Finnhub API
 */
export const companyProfileSchema = z.object({
  symbol: z.string(),
  name: z.string(),
  logo: z.string().url().optional(),
  finnhubIndustry: z.string().optional(),
  weburl: z.string().url().optional(),
  marketCapitalization: z.number().optional(),
  shareOutstanding: z.number().optional(),
  currency: z.string().optional(),
  exchange: z.string().optional(),
  ipo: z.string().optional(),
  phone: z.string().optional(),
  country: z.string().optional(),
});

export type CompanyProfile = z.infer<typeof companyProfileSchema>;

/**
 * Stock Metrics Schema (fundamentals from Finnhub)
 * Validates fundamental metrics data
 */
export const stockMetricsSchema = z.object({
  metric: z.object({
    "10DayAverageTradingVolume": z.number().optional(),
    "52WeekHigh": z.number().optional(),
    "52WeekLow": z.number().optional(),
    "52WeekLowDate": z.string().optional(),
    "52WeekHighDate": z.string().optional(),
    "52WeekPriceReturnDaily": z.number().optional(),
    beta: z.number().optional(),
    peNormalizedAnnual: z.number().optional(),
    epsNormalizedAnnual: z.number().optional(),
    dividendYieldIndicatedAnnual: z.number().optional(),
    revenuePerShareAnnual: z.number().optional(),
    bookValuePerShareAnnual: z.number().optional(),
  }),
  series: z.object({}).optional(),
});

export type StockMetrics = z.infer<typeof stockMetricsSchema>;

/**
 * Candle Data Schema (price data from Finnhub)
 * Validates historical price candle data
 */
export const candleDataSchema = z.object({
  c: z.array(z.number()), // Close prices
  h: z.array(z.number()), // High prices
  l: z.array(z.number()), // Low prices
  o: z.array(z.number()), // Open prices
  t: z.array(z.number()), // Timestamps
  v: z.array(z.number()), // Volume
  s: z.enum(["ok", "no_data"]), // Status
});

export type CandleData = z.infer<typeof candleDataSchema>;

/**
 * Social Sentiment Schema (from Finnhub)
 * Validates social sentiment data
 */
export const socialSentimentItemSchema = z.object({
  atTime: z.string(),
  mention: z.number(),
  positiveScore: z.number(),
  negativeScore: z.number(),
  positiveMention: z.number().optional(),
  negativeMention: z.number().optional(),
  score: z.number(),
});

export const socialSentimentSchema = z.object({
  symbol: z.string(),
  data: z.array(socialSentimentItemSchema),
});

export type SocialSentiment = z.infer<typeof socialSentimentSchema>;
export type SocialSentimentItem = z.infer<typeof socialSentimentItemSchema>;

/**
 * Recommendation Schema (analyst recommendations from Finnhub)
 * Validates analyst recommendation data
 */
export const recommendationSchema = z.object({
  buy: z.number(),
  hold: z.number(),
  sell: z.number(),
  strongBuy: z.number(),
  strongSell: z.number(),
  period: z.string(),
  symbol: z.string().optional(),
});

export type Recommendation = z.infer<typeof recommendationSchema>;

/**
 * API Response Schemas for our endpoints
 */

/**
 * Company API Response Schema
 * Full response from /api/company endpoint
 */
export const companyAPIResponseSchema = z.object({
  profile: z.object({
    symbol: z.string(),
    name: z.string(),
    logo: z.string().optional(),
    industry: z.string().optional(),
    description: z.string().optional(),
    marketCap: z.number().optional(),
    weburl: z.string().optional(),
  }),
  fundamentals: z.object({
    pe: z.number().optional(),
    eps: z.number().optional(),
    revenue: z.number().optional(),
    dividendYield: z.number().optional(),
    beta: z.number().optional(),
    high52Week: z.number().optional(),
    low52Week: z.number().optional(),
  }),
  analystConsensus: z.object({
    rating: z.string(),
    targetPriceHigh: z.number().optional(),
    targetPriceLow: z.number().optional(),
    targetPriceAverage: z.number().optional(),
    buy: z.number(),
    hold: z.number(),
    sell: z.number(),
  }),
  prices: z.object({
    timestamps: z.array(z.number()),
    open: z.array(z.number()),
    high: z.array(z.number()),
    low: z.array(z.number()),
    close: z.array(z.number()),
    volume: z.array(z.number()),
  }),
  macd: z.object({
    timestamps: z.array(z.number()),
    macd: z.array(z.number()),
    signal: z.array(z.number()),
    histogram: z.array(z.number()),
  }),
  socialSentiment: z.object({
    timestamps: z.array(z.number()),
    score: z.array(z.number()),
    mentions: z.array(z.number()),
  }),
  meta: z.object({
    cached: z.boolean(),
    stale: z.boolean().optional(),
    source: z.string().optional(),
    fetchedAt: z.string(),
  }),
});

export type CompanyAPIResponse = z.infer<typeof companyAPIResponseSchema>;

/**
 * Prices API Response Schema
 * Response from /api/prices endpoint
 */
export const pricesAPIResponseSchema = z.object({
  symbol: z.string(),
  resolution: z.string(),
  range: z.string(),
  prices: z.object({
    timestamps: z.array(z.number()),
    open: z.array(z.number()),
    high: z.array(z.number()),
    low: z.array(z.number()),
    close: z.array(z.number()),
    volume: z.array(z.number()),
  }),
  meta: z.object({
    cached: z.boolean(),
    fetchedAt: z.string(),
  }),
});

export type PricesAPIResponse = z.infer<typeof pricesAPIResponseSchema>;

/**
 * Sentiment API Response Schema
 * Response from /api/sentiment endpoint
 */
export const sentimentAPIResponseSchema = z.object({
  symbol: z.string(),
  range: z.string(),
  sentiment: z.object({
    timestamps: z.array(z.number()),
    score: z.array(z.number()),
    mentions: z.array(z.number()),
  }),
  meta: z.object({
    cached: z.boolean(),
    simulated: z.boolean().optional(),
    fetchedAt: z.string(),
  }),
});

export type SentimentAPIResponse = z.infer<typeof sentimentAPIResponseSchema>;

/**
 * Error Response Schema
 * Standard error response for all API endpoints
 */
export const errorResponseSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;

/**
 * Query Parameters Schema for API routes
 */
export const companyQuerySchema = z.object({
  symbol: tickerSymbolSchema,
});

export const pricesQuerySchema = z.object({
  symbol: tickerSymbolSchema,
  range: rangeSchema.optional(),
  resolution: resolutionSchema.optional(),
});

export const sentimentQuerySchema = z.object({
  symbol: tickerSymbolSchema,
  range: rangeSchema.optional(),
});

/**
 * Helper function to safely parse and validate data
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Validated data or throws error
 */
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Helper function to safely parse without throwing
 *
 * @param schema - Zod schema to validate against
 * @param data - Data to validate
 * @returns Success with data or error result
 */
export function safeValidateData<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: z.ZodError } {
  const result = schema.safeParse(data);
  return result.success
    ? { success: true, data: result.data }
    : { success: false, error: result.error };
}

/**
 * Sentiment API Route
 *
 * GET /api/sentiment?symbol=AAPL&range=1M
 *
 * Fetches social sentiment data for a stock symbol.
 * Falls back to simulated data if sentiment API unavailable.
 */

import { NextRequest, NextResponse } from "next/server";
import { finnhub, FinnhubError } from "@/lib/finnhub";
import { withCache } from "@/lib/redis";
import {
  sentimentQuerySchema,
  type SentimentAPIResponse,
} from "@/lib/validations/stock";
import { ZodError } from "zod";

// Cache TTL for sentiment data (5 minutes)
const CACHE_TTL = 5 * 60;

/**
 * Convert range string to from/to timestamps and dates
 */
function getRangeDates(range: string): { from: string; to: string } {
  const now = new Date();
  const dayInMs = 24 * 60 * 60 * 1000;

  const rangeToDays: Record<string, number> = {
    "1D": 1,
    "5D": 5,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825,
  };

  const days = rangeToDays[range] || 30;
  const fromDate = new Date(now.getTime() - days * dayInMs);

  return {
    from: fromDate.toISOString().split("T")[0], // YYYY-MM-DD
    to: now.toISOString().split("T")[0],
  };
}

/**
 * Generate simulated sentiment based on price volatility
 * Used as fallback when social sentiment API is unavailable
 */
function generateSimulatedSentiment(
  symbol: string,
  days: number = 30
): {
  timestamps: number[];
  score: number[];
  mentions: number[];
} {
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 24 * 60 * 60;

  const timestamps: number[] = [];
  const score: number[] = [];
  const mentions: number[] = [];

  for (let i = 0; i < days; i++) {
    const timestamp = now - (days - 1 - i) * dayInSeconds;
    timestamps.push(timestamp);

    // Generate realistic-looking sentiment score (0-1 scale)
    const baseScore = 0.55; // Slightly positive bias
    const variation = (Math.random() - 0.5) * 0.3;
    score.push(Math.max(0, Math.min(1, baseScore + variation)));

    // Generate random mention counts
    mentions.push(Math.floor(Math.random() * 500 + 800));
  }

  return { timestamps, score, mentions };
}

/**
 * GET /api/sentiment
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const range = searchParams.get("range") || "1M";

    const validatedParams = sentimentQuerySchema.parse({ symbol, range });

    const symbolUpper = validatedParams.symbol;
    const rangeValue = validatedParams.range || "1M";

    // Cache key includes symbol and range
    const cacheKey = `finnhub:sentiment:${symbolUpper}:${rangeValue}`;

    // Fetch with caching
    const { data, cached } = await withCache(
      cacheKey,
      CACHE_TTL,
      async () => {
        const { from, to } = getRangeDates(rangeValue);
        let isSimulated = false;

        let sentimentData;

        try {
          // Try to fetch real sentiment data
          sentimentData = await finnhub.getSocialSentiment({
            symbol: symbolUpper,
            from,
            to,
          });
        } catch (error) {
          console.warn(
            "[Sentiment API] Social sentiment unavailable, using simulated data:",
            error instanceof Error ? error.message : String(error)
          );

          // Use simulated data as fallback
          isSimulated = true;
          const simulated = generateSimulatedSentiment(
            symbolUpper,
            parseInt(rangeValue.replace(/\D/g, "")) || 30
          );

          sentimentData = {
            symbol: symbolUpper,
            data: simulated.timestamps.map((timestamp, i) => ({
              atTime: new Date(timestamp * 1000).toISOString().split("T")[0],
              mention: simulated.mentions[i],
              positiveScore: simulated.score[i],
              negativeScore: 1 - simulated.score[i],
              score: simulated.score[i] * 2 - 1, // Convert to -1 to 1
            })),
          };
        }

        const response: SentimentAPIResponse = {
          symbol: symbolUpper,
          range: rangeValue,
          sentiment: {
            timestamps: sentimentData.data.map((item) =>
              Math.floor(new Date(item.atTime).getTime() / 1000)
            ),
            score: sentimentData.data.map((item) => {
              // Normalize from -1/1 to 0/1 scale
              return (item.score + 1) / 2;
            }),
            mentions: sentimentData.data.map((item) => item.mention),
          },
          meta: {
            cached: false,
            simulated: isSimulated,
            fetchedAt: new Date().toISOString(),
          },
        };

        return response;
      }
    );

    // Update cache status in response
    const responseData: SentimentAPIResponse = {
      ...data,
      meta: {
        ...data.meta,
        cached,
      },
    };

    return NextResponse.json(responseData, {
      headers: {
        "Cache-Control": "private, max-age=300",
        "X-Cache-Status": cached ? "HIT" : "MISS",
      },
    });
  } catch (error) {
    console.error("[Sentiment API] Error:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_PARAMS",
            message: "Invalid query parameters",
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }

    // Handle Finnhub errors
    if (error instanceof FinnhubError) {
      const statusCode = error.statusCode || 500;

      return NextResponse.json(
        {
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: statusCode }
      );
    }

    // Handle generic errors
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
          details:
            error instanceof Error
              ? { message: error.message }
              : { error: String(error) },
        },
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS - CORS preflight
 */
export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}

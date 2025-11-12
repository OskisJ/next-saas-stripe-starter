/**
 * Prices API Route
 *
 * GET /api/prices?symbol=AAPL&range=1M&resolution=D
 *
 * Fetches historical price data with flexible date ranges.
 * Supports different time ranges and resolutions.
 */

import { NextRequest, NextResponse } from "next/server";
import { finnhub, FinnhubError } from "@/lib/finnhub";
import { withCache } from "@/lib/redis";
import {
  pricesQuerySchema,
  type PricesAPIResponse,
} from "@/lib/validations/stock";
import { ZodError } from "zod";

// Cache TTL for price data (5 minutes)
const CACHE_TTL = 5 * 60;

/**
 * Convert range string to from/to timestamps
 */
function getRangeTimestamps(range: string): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  const dayInSeconds = 24 * 60 * 60;

  const rangeToDays: Record<string, number> = {
    "1D": 1,
    "5D": 5,
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825,
  };

  const days = rangeToDays[range] || 30; // Default to 1 month

  return {
    from: now - days * dayInSeconds,
    to: now,
  };
}

/**
 * GET /api/prices
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");
    const range = searchParams.get("range") || "1M";
    const resolution = searchParams.get("resolution") || "D";

    const validatedParams = pricesQuerySchema.parse({
      symbol,
      range,
      resolution,
    });

    const symbolUpper = validatedParams.symbol;
    const rangeValue = validatedParams.range || "1M";
    const resolutionValue = validatedParams.resolution || "D";

    // Cache key includes all parameters
    const cacheKey = `finnhub:prices:${symbolUpper}:${rangeValue}:${resolutionValue}`;

    // Fetch with caching
    const { data, cached } = await withCache(
      cacheKey,
      CACHE_TTL,
      async () => {
        const { from, to } = getRangeTimestamps(rangeValue);

        const candles = await finnhub.getCandles({
          symbol: symbolUpper,
          resolution: resolutionValue,
          from,
          to,
        });

        const response: PricesAPIResponse = {
          symbol: symbolUpper,
          resolution: resolutionValue,
          range: rangeValue,
          prices: {
            timestamps: candles.t,
            open: candles.o,
            high: candles.h,
            low: candles.l,
            close: candles.c,
            volume: candles.v,
          },
          meta: {
            cached: false,
            fetchedAt: new Date().toISOString(),
          },
        };

        return response;
      }
    );

    // Update cache status in response
    const responseData: PricesAPIResponse = {
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
    console.error("[Prices API] Error:", error);

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

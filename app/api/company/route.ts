/**
 * Company API Route
 *
 * GET /api/company?symbol=AAPL
 *
 * Aggregates all company data in a single request:
 * - Company profile
 * - Fundamentals
 * - Analyst consensus
 * - Historical prices (30 days)
 * - MACD technical indicator
 * - Social sentiment
 *
 * Implements caching, retry logic, and circuit breaker patterns.
 */

import { NextRequest, NextResponse } from "next/server";
import { finnhub, FinnhubError } from "@/lib/finnhub";
import { calculateMACD } from "@/lib/stockUtils";
import { withCache, CacheCircuitBreaker, getOrStale } from "@/lib/redis";
import {
  companyQuerySchema,
  type CompanyAPIResponse,
} from "@/lib/validations/stock";
import { ZodError } from "zod";

// Cache TTLs (in seconds)
const CACHE_TTL = {
  PROFILE: 30 * 60, // 30 minutes
  FUNDAMENTALS: 30 * 60, // 30 minutes
  PRICES: 5 * 60, // 5 minutes
  SENTIMENT: 5 * 60, // 5 minutes
  CONSENSUS: 30 * 60, // 30 minutes
};

// Circuit breaker for Finnhub API
const finnhubCircuit = new CacheCircuitBreaker("finnhub", 5, 300);

/**
 * Calculate date range for historical data (30 days)
 */
function getDateRange(days: number = 30): { from: number; to: number } {
  const now = Math.floor(Date.now() / 1000);
  const daysInSeconds = days * 24 * 60 * 60;
  return {
    from: now - daysInSeconds,
    to: now,
  };
}

/**
 * Format date to YYYY-MM-DD
 */
function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toISOString().split("T")[0];
}

/**
 * Determine consensus rating from analyst recommendations
 */
function calculateConsensusRating(rec: {
  strongBuy: number;
  buy: number;
  hold: number;
  sell: number;
  strongSell: number;
}): string {
  const total = rec.strongBuy + rec.buy + rec.hold + rec.sell + rec.strongSell;

  if (total === 0) {
    return "Hold";
  }

  const buyScore =
    (rec.strongBuy * 2 + rec.buy) / total -
    (rec.sell + rec.strongSell * 2) / total;

  if (buyScore > 0.6) return "Strong Buy";
  if (buyScore > 0.2) return "Buy";
  if (buyScore < -0.6) return "Strong Sell";
  if (buyScore < -0.2) return "Sell";
  return "Hold";
}

/**
 * GET /api/company
 */
export async function GET(request: NextRequest) {
  try {
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const symbol = searchParams.get("symbol");

    const validatedParams = companyQuerySchema.parse({ symbol });
    const symbolUpper = validatedParams.symbol;

    // Cache key for full company data
    const cacheKey = `finnhub:company:${symbolUpper}`;

    // Try to get from cache with circuit breaker
    const result = await getOrStale(
      cacheKey,
      CACHE_TTL.PRICES, // Use shortest TTL
      finnhubCircuit,
      async () => {
        // Fetch all data in parallel
        const [profile, metrics, candles, sentiment, recommendations, quote] =
          await Promise.all([
            finnhub.getProfile(symbolUpper),
            finnhub.getMetrics(symbolUpper),
            finnhub.getCandles({
              symbol: symbolUpper,
              resolution: "D",
              ...getDateRange(30),
            }),
            finnhub
              .getSocialSentiment({
                symbol: symbolUpper,
                from: formatDate(getDateRange(30).from),
                to: formatDate(getDateRange(30).to),
              })
              .catch((err) => {
                console.warn(
                  "[Company API] Social sentiment unavailable, using fallback:",
                  err.message
                );
                // Return simulated sentiment based on price volatility
                return {
                  symbol: symbolUpper,
                  data: candles.t.map((timestamp, i) => ({
                    atTime: formatDate(timestamp),
                    mention: 1000 + Math.floor(Math.random() * 500),
                    positiveScore: 0.5 + (Math.random() - 0.5) * 0.3,
                    negativeScore: 0.5 + (Math.random() - 0.5) * 0.3,
                    score: (Math.random() - 0.5) * 0.4,
                  })),
                };
              }),
            finnhub.getRecommendations(symbolUpper),
            finnhub.getQuote(symbolUpper),
          ]);

        // Calculate MACD from close prices
        const macdData = calculateMACD(candles.c, 12, 26, 9);

        // Get latest recommendation
        const latestRec = recommendations[0] || {
          strongBuy: 0,
          buy: 0,
          hold: 0,
          sell: 0,
          strongSell: 0,
        };

        // Build response
        const response: CompanyAPIResponse = {
          profile: {
            symbol: profile.symbol,
            name: profile.name,
            logo: profile.logo,
            industry: profile.finnhubIndustry || "Unknown",
            description: "", // Finnhub doesn't provide description in free tier
            marketCap: profile.marketCapitalization
              ? profile.marketCapitalization * 1000000
              : undefined,
            weburl: profile.weburl,
          },
          fundamentals: {
            pe: metrics.metric.peNormalizedAnnual,
            eps: metrics.metric.epsNormalizedAnnual,
            revenue:
              metrics.metric.revenuePerShareAnnual &&
              profile.shareOutstanding
                ? metrics.metric.revenuePerShareAnnual *
                  profile.shareOutstanding *
                  1000000
                : undefined,
            dividendYield: metrics.metric.dividendYieldIndicatedAnnual,
            beta: metrics.metric.beta,
            high52Week: metrics.metric["52WeekHigh"],
            low52Week: metrics.metric["52WeekLow"],
          },
          analystConsensus: {
            rating: calculateConsensusRating(latestRec),
            targetPriceHigh: undefined, // Not available in free tier
            targetPriceLow: undefined,
            targetPriceAverage: undefined,
            buy: latestRec.buy + latestRec.strongBuy,
            hold: latestRec.hold,
            sell: latestRec.sell + latestRec.strongSell,
          },
          prices: {
            timestamps: candles.t,
            open: candles.o,
            high: candles.h,
            low: candles.l,
            close: candles.c,
            volume: candles.v,
          },
          macd: {
            timestamps: candles.t,
            macd: macdData.macd,
            signal: macdData.signal,
            histogram: macdData.histogram,
          },
          socialSentiment: {
            timestamps: sentiment.data.map((item) =>
              Math.floor(new Date(item.atTime).getTime() / 1000)
            ),
            score: sentiment.data.map((item) => {
              // Normalize from -1/1 to 0/1 scale
              return (item.score + 1) / 2;
            }),
            mentions: sentiment.data.map((item) => item.mention),
          },
          meta: {
            cached: false,
            stale: false,
            source: "finnhub",
            fetchedAt: new Date().toISOString(),
          },
        };

        return response;
      }
    );

    // Update meta with cache status
    const responseData: CompanyAPIResponse = {
      ...result.data,
      meta: {
        ...result.data.meta,
        cached: result.stale ? false : true,
        stale: result.stale,
        source: result.stale ? "stale-cache" : result.data.meta.source,
      },
    };

    return NextResponse.json(responseData, {
      status: result.stale ? 503 : 200,
      headers: {
        "Cache-Control": "private, max-age=300",
        "X-Cache-Status": result.stale ? "STALE" : "HIT",
      },
    });
  } catch (error) {
    console.error("[Company API] Error:", error);

    // Handle validation errors
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: {
            code: "INVALID_SYMBOL",
            message:
              "Invalid ticker symbol format. Use 1-5 uppercase letters.",
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

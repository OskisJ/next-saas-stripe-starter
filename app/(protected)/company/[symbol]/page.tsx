import { notFound } from "next/navigation";
import { CompanyHeader } from "@/components/stock/company-header";
import { FundamentalsPanel } from "@/components/stock/fundamentals-panel";
import { PriceChart } from "@/components/stock/price-chart";
import { MACDChart } from "@/components/stock/macd-chart";
import { SentimentChart } from "@/components/stock/sentiment-chart";
import { ComparisonChart } from "@/components/stock/comparison-chart";
import { AnalystPanel } from "@/components/stock/analyst-panel";
import { TickerSearch } from "@/components/stock/ticker-search";
import { ErrorMessage } from "@/components/stock/error-message";
import type { CompanyAPIResponse } from "@/lib/validations/stock";

interface PageProps {
  params: {
    symbol: string;
  };
}

/**
 * Fetch company data from API
 */
async function getCompanyData(symbol: string): Promise<CompanyAPIResponse> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const url = `${baseUrl}/api/company?symbol=${symbol.toUpperCase()}`;

  const res = await fetch(url, {
    cache: "no-store", // Always fetch fresh data
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || `Failed to fetch company data (${res.status})`
    );
  }

  return res.json();
}

/**
 * Stock Dashboard Page
 *
 * Displays comprehensive stock information including:
 * - Company profile and current price
 * - Key fundamental metrics
 * - Price chart with technical analysis (MACD)
 * - Social sentiment tracking
 * - Analyst consensus
 */
export default async function CompanyPage({ params }: PageProps) {
  let data: CompanyAPIResponse | null = null;
  let error: any = null;

  try {
    data = await getCompanyData(params.symbol);
  } catch (err) {
    error = err;
    console.error("[Company Page] Error fetching data:", err);
  }

  // If error and no data, show error
  if (error && !data) {
    return (
      <div className="container mx-auto max-w-7xl space-y-6 py-8">
        <TickerSearch initialValue={params.symbol} />
        <ErrorMessage
          error={{
            code: "FETCH_ERROR",
            message: error.message || "Failed to fetch company data",
          }}
        />
      </div>
    );
  }

  // If no data at all (shouldn't happen)
  if (!data) {
    notFound();
  }

  // Calculate current price and change from latest price data
  const latestPrice = data.prices.close[data.prices.close.length - 1];
  const previousPrice = data.prices.close[data.prices.close.length - 2];
  const priceChange = latestPrice - previousPrice;
  const priceChangePercent = previousPrice !== 0 ? priceChange / previousPrice : 0;

  return (
    <div className="container mx-auto max-w-7xl space-y-6 py-8">
      {/* Search Bar */}
      <TickerSearch initialValue={params.symbol} />

      {/* Stale Data Warning */}
      {data.meta.stale && (
        <ErrorMessage
          error={{
            code: "STALE_DATA",
            message:
              "Data may be outdated. Last updated " +
              new Date(data.meta.fetchedAt).toLocaleString(),
          }}
        />
      )}

      {/* Company Header with Logo and Price */}
      <CompanyHeader
        profile={data.profile}
        currentPrice={{
          price: latestPrice,
          change: priceChange,
          changePercent: priceChangePercent,
        }}
      />

      {/* Fundamentals Panel */}
      <FundamentalsPanel fundamentals={data.fundamentals} />

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-6">
          <PriceChart data={data.prices} symbol={data.profile.symbol} />
          <MACDChart data={data.macd} symbol={data.profile.symbol} />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SentimentChart
            data={data.socialSentiment}
            symbol={data.profile.symbol}
            isSimulated={false}
          />
          <ComparisonChart
            macdData={{
              timestamps: data.macd.timestamps,
              macd: data.macd.macd,
            }}
            sentimentData={{
              timestamps: data.socialSentiment.timestamps,
              score: data.socialSentiment.score,
            }}
            symbol={data.profile.symbol}
          />
        </div>
      </div>

      {/* Analyst Consensus */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <AnalystPanel consensus={data.analystConsensus} />
        </div>
      </div>
    </div>
  );
}

/**
 * Generate metadata for the page
 */
export async function generateMetadata({ params }: PageProps) {
  try {
    const data = await getCompanyData(params.symbol);
    return {
      title: `${data.profile.name} (${data.profile.symbol}) | Stock Dashboard`,
      description: `View real-time stock data, technical analysis, and social sentiment for ${data.profile.name}.`,
    };
  } catch {
    return {
      title: `${params.symbol} | Stock Dashboard`,
      description: "Stock market data and analysis",
    };
  }
}

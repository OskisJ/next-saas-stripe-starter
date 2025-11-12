/**
 * Finnhub Mock Data
 *
 * Canned responses for development without API key.
 * Provides realistic sample data for all Finnhub endpoints.
 */

import type {
  CompanyProfile,
  StockMetrics,
  CandleData,
  SocialSentiment,
  Recommendation,
} from "./validations/stock";

// Generate 30 days of mock timestamps (daily)
const now = Math.floor(Date.now() / 1000);
const dayInSeconds = 86400;
const mockTimestamps = Array.from({ length: 30 }, (_, i) =>
  Math.floor(now - (29 - i) * dayInSeconds)
);

// Generate realistic price data starting from $185
const generatePriceData = (
  basePrice: number,
  volatility: number = 2
): number[] => {
  const prices: number[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < 30; i++) {
    const change = (Math.random() - 0.5) * volatility;
    currentPrice = Math.max(currentPrice + change, basePrice * 0.9);
    prices.push(Number(currentPrice.toFixed(2)));
  }

  return prices;
};

const closePrices = generatePriceData(185);
const openPrices = closePrices.map((price) => price + (Math.random() - 0.5));
const highPrices = closePrices.map((price) => price + Math.random() * 2);
const lowPrices = closePrices.map((price) => price - Math.random() * 2);
const volumes = Array.from({ length: 30 }, () =>
  Math.floor(Math.random() * 20000000 + 40000000)
);

/**
 * Mock Company Profile (Apple Inc.)
 */
export const mockCompanyProfile: CompanyProfile = {
  symbol: "AAPL",
  name: "Apple Inc.",
  logo: "https://static.finnhub.io/logo/87cb30d8-80df-11ea-8951-00000000092a.png",
  finnhubIndustry: "Technology",
  weburl: "https://www.apple.com",
  marketCapitalization: 2800000,
  shareOutstanding: 15000,
  currency: "USD",
  exchange: "NASDAQ",
  ipo: "1980-12-12",
  phone: "14089961010",
  country: "US",
};

/**
 * Mock Stock Metrics (Fundamentals)
 */
export const mockStockMetrics: StockMetrics = {
  metric: {
    "10DayAverageTradingVolume": 52340000,
    "52WeekHigh": 198.23,
    "52WeekLow": 124.17,
    "52WeekLowDate": "2024-01-15",
    "52WeekHighDate": "2024-12-28",
    "52WeekPriceReturnDaily": 0.45,
    beta: 1.28,
    peNormalizedAnnual: 28.5,
    epsNormalizedAnnual: 6.15,
    dividendYieldIndicatedAnnual: 0.52,
    revenuePerShareAnnual: 25.8,
    bookValuePerShareAnnual: 4.25,
  },
  series: {},
};

/**
 * Mock Candle Data (30 days of price data)
 */
export const mockCandles: CandleData = {
  c: closePrices,
  h: highPrices,
  l: lowPrices,
  o: openPrices,
  t: mockTimestamps,
  v: volumes,
  s: "ok",
};

/**
 * Mock Social Sentiment (30 days)
 */
export const mockSocialSentiment: SocialSentiment = {
  symbol: "AAPL",
  data: mockTimestamps.map((timestamp, i) => {
    const baseScore = 0.65;
    const variation = (Math.random() - 0.5) * 0.2;
    const score = Math.max(
      0,
      Math.min(1, baseScore + variation)
    );

    return {
      atTime: new Date(timestamp * 1000).toISOString().split("T")[0],
      mention: Math.floor(Math.random() * 500 + 1000),
      positiveScore: score,
      negativeScore: 1 - score,
      positiveMention: Math.floor(Math.random() * 300 + 600),
      negativeMention: Math.floor(Math.random() * 200 + 400),
      score: score * 2 - 1, // Convert 0-1 to -1 to 1
    };
  }),
};

/**
 * Mock Analyst Recommendations
 */
export const mockRecommendations: Recommendation[] = [
  {
    buy: 15,
    hold: 8,
    sell: 2,
    strongBuy: 10,
    strongSell: 0,
    period: new Date().toISOString().split("T")[0],
    symbol: "AAPL",
  },
];

/**
 * Mock data for different companies
 * Allows testing with various ticker symbols
 */
export const mockDataBySymbol: Record<
  string,
  {
    profile: Partial<CompanyProfile>;
    basePrice: number;
    volatility: number;
  }
> = {
  AAPL: {
    profile: mockCompanyProfile,
    basePrice: 185,
    volatility: 2,
  },
  MSFT: {
    profile: {
      symbol: "MSFT",
      name: "Microsoft Corporation",
      logo: "https://static.finnhub.io/logo/microsoft.png",
      finnhubIndustry: "Technology",
      weburl: "https://www.microsoft.com",
      marketCapitalization: 2500000,
    },
    basePrice: 380,
    volatility: 3,
  },
  GOOGL: {
    profile: {
      symbol: "GOOGL",
      name: "Alphabet Inc.",
      logo: "https://static.finnhub.io/logo/google.png",
      finnhubIndustry: "Technology",
      weburl: "https://www.google.com",
      marketCapitalization: 1800000,
    },
    basePrice: 140,
    volatility: 2.5,
  },
  TSLA: {
    profile: {
      symbol: "TSLA",
      name: "Tesla, Inc.",
      logo: "https://static.finnhub.io/logo/tesla.png",
      finnhubIndustry: "Automotive",
      weburl: "https://www.tesla.com",
      marketCapitalization: 800000,
    },
    basePrice: 250,
    volatility: 5,
  },
  AMZN: {
    profile: {
      symbol: "AMZN",
      name: "Amazon.com, Inc.",
      logo: "https://static.finnhub.io/logo/amazon.png",
      finnhubIndustry: "E-commerce",
      weburl: "https://www.amazon.com",
      marketCapitalization: 1600000,
    },
    basePrice: 170,
    volatility: 3,
  },
};

/**
 * Generate mock data for any symbol
 *
 * @param symbol - Stock ticker symbol
 * @returns Mock data for the symbol
 */
export function getMockData(symbol: string) {
  const symbolUpper = symbol.toUpperCase();
  const mockData = mockDataBySymbol[symbolUpper];

  if (!mockData) {
    // Return default data for unknown symbols
    return {
      profile: {
        ...mockCompanyProfile,
        symbol: symbolUpper,
        name: `${symbolUpper} Corporation`,
        logo: undefined,
      },
      metrics: mockStockMetrics,
      candles: mockCandles,
      sentiment: {
        ...mockSocialSentiment,
        symbol: symbolUpper,
      },
      recommendations: mockRecommendations.map((rec) => ({
        ...rec,
        symbol: symbolUpper,
      })),
    };
  }

  // Generate custom price data based on symbol's base price and volatility
  const customPrices = generatePriceData(
    mockData.basePrice,
    mockData.volatility
  );

  return {
    profile: {
      ...mockCompanyProfile,
      ...mockData.profile,
    },
    metrics: {
      ...mockStockMetrics,
      metric: {
        ...mockStockMetrics.metric,
        peNormalizedAnnual: 20 + Math.random() * 20,
        epsNormalizedAnnual: 3 + Math.random() * 5,
      },
    },
    candles: {
      c: customPrices,
      h: customPrices.map((p) => p + Math.random() * 2),
      l: customPrices.map((p) => p - Math.random() * 2),
      o: customPrices.map((p) => p + (Math.random() - 0.5)),
      t: mockTimestamps,
      v: volumes,
      s: "ok" as const,
    },
    sentiment: {
      ...mockSocialSentiment,
      symbol: symbolUpper,
    },
    recommendations: mockRecommendations.map((rec) => ({
      ...rec,
      symbol: symbolUpper,
    })),
  };
}

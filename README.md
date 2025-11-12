<a href="https://next-saas-stripe-starter.vercel.app">
  <img alt="SaaS Starter" src="public/_static/og.jpg">
  <h1 align="center">Next SaaS Stripe Starter</h1>
</a>

<p align="center">
  Start at full speed with SaaS Starter !
</p>

<p align="center">
  <a href="https://twitter.com/miickasmt">
    <img src="https://img.shields.io/twitter/follow/miickasmt?style=flat&label=miickasmt&logo=twitter&color=0bf&logoColor=fff" alt="Mickasmt Twitter follower count" />
  </a>
</p>

<p align="center">
  <a href="#introduction"><strong>Introduction</strong></a> ·
  <a href="#installation"><strong>Installation</strong></a> ·
  <a href="#tech-stack--features"><strong>Tech Stack + Features</strong></a> ·
  <a href="#author"><strong>Author</strong></a> ·
  <a href="#credits"><strong>Credits</strong></a>
</p>
<br/>

## Introduction

Empower your next project with the stack of Next.js 14, Prisma, Neon, Auth.js v5, Resend, React Email, Shadcn/ui, and Stripe.
<br/>
All seamlessly integrated with the SaaS Starter to accelerate your development and saas journey.

## Installation

Clone & create this repo locally with the following command:

```bash
npx create-next-app my-saas-project --example "https://github.com/mickasmt/next-saas-stripe-starter"
```

Or, deploy with Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fmickasmt%2Fnext-saas-stripe-starter)

### Steps

1. Install dependencies using pnpm:

```sh
pnpm install
```

2. Copy `.env.example` to `.env.local` and update the variables.

```sh
cp .env.example .env.local
```

3. Start the development server:

```sh
pnpm run dev
```

> [!NOTE]  
> I use [npm-check-updates](https://www.npmjs.com/package/npm-check-updates) package for update this project.
>
> Use this command for update your project: `ncu -i --format group`

## Roadmap
- [ ] Upgrade eslint to v9
- [ ] Add resend for success subscriptions

## Tech Stack + Features

https://github.com/mickasmt/next-saas-stripe-starter/assets/62285783/828a4e0f-30e3-4cfe-96ff-4dfd9cd55124

### Frameworks

- [Next.js](https://nextjs.org/) – React framework for building performant apps with the best developer experience
- [Auth.js](https://authjs.dev/) – Handle user authentication with ease with providers like Google, Twitter, GitHub, etc.
- [Prisma](https://www.prisma.io/) – Typescript-first ORM for Node.js
- [React Email](https://react.email/) – Versatile email framework for efficient and flexible email development

### Platforms

- [Vercel](https://vercel.com/) – Easily preview & deploy changes with git
- [Resend](https://resend.com/) – A powerful email framework for streamlined email development
- [Neon](https://neon.tech/) – Serverless Postgres with autoscaling, branching, bottomless storage and generous free tier.

### UI

- [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework for rapid UI development
- [Shadcn/ui](https://ui.shadcn.com/) – Re-usable components built using Radix UI and Tailwind CSS
- [Framer Motion](https://framer.com/motion) – Motion library for React to animate components with ease
- [Lucide](https://lucide.dev/) – Beautifully simple, pixel-perfect icons
- [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) – Optimize custom fonts and remove external network requests for improved performance
- [`ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response) – Generate dynamic Open Graph images at the edge

### Hooks and Utilities

- `useIntersectionObserver` – React hook to observe when an element enters or leaves the viewport
- `useLocalStorage` – Persist data in the browser's local storage
- `useScroll` – React hook to observe scroll position ([example](https://github.com/mickasmt/precedent/blob/main/components/layout/navbar.tsx#L12))
- `nFormatter` – Format numbers with suffixes like `1.2k` or `1.2M`
- `capitalize` – Capitalize the first letter of a string
- `truncate` – Truncate a string to a specified length
- [`use-debounce`](https://www.npmjs.com/package/use-debounce) – Debounce a function call / state update

### Code Quality

- [TypeScript](https://www.typescriptlang.org/) – Static type checker for end-to-end typesafety
- [Prettier](https://prettier.io/) – Opinionated code formatter for consistent code style
- [ESLint](https://eslint.org/) – Pluggable linter for Next.js and TypeScript

### Miscellaneous

- [Vercel Analytics](https://vercel.com/analytics) – Track unique visitors, pageviews, and more in a privacy-friendly way

## Stock Dashboard Feature

Production-ready stock dashboard with real-time data from Finnhub API, featuring comprehensive technical analysis, social sentiment tracking, and analyst consensus.

### Features

- **Real-time Stock Data** – Company profiles, fundamentals, and live price updates
- **Technical Analysis** – MACD indicator with configurable parameters (12,26,9)
- **Social Sentiment** – Track social media sentiment and mentions over time
- **Analyst Consensus** – View analyst ratings and price targets
- **Interactive Charts** – Built with Recharts, featuring zoom, tooltips, and export functionality
- **Redis Caching** – Intelligent caching with configurable TTLs (5-30 minutes)
- **Error Handling** – Retry logic with exponential backoff and circuit breaker pattern
- **Mock Mode** – Develop without API key using canned data
- **Docker Ready** – Complete Docker and docker-compose configuration
- **Fully Tested** – Unit tests with Vitest (80%+ coverage goal)

### Quick Start

#### 1. Get Finnhub API Key

Sign up at [Finnhub.io](https://finnhub.io/register) to get your free API key.

#### 2. Configure Environment Variables

Add to your `.env.local`:

```bash
# Stock Dashboard
FINNHUB_API_KEY=your_finnhub_api_key_here
REDIS_URL=redis://localhost:6379  # Optional
NODE_ENV=development
```

#### 3. Start Redis (Optional but Recommended)

Using Docker:

```bash
docker run -d -p 6379:6379 redis:7-alpine
```

Or with docker-compose:

```bash
docker-compose up -d redis postgres
```

#### 4. Run the Development Server

```bash
npm run dev
```

Visit [http://localhost:3000/company/AAPL](http://localhost:3000/company/AAPL) to see the dashboard.

### Mock Mode

For development without an API key:

```bash
FINNHUB_API_KEY=mock
```

This uses canned data for all API calls.

### API Endpoints

#### GET /api/company?symbol=AAPL

Returns comprehensive company data including profile, fundamentals, prices, MACD, and sentiment.

**Response:**

```json
{
  "profile": { "symbol": "AAPL", "name": "Apple Inc.", ... },
  "fundamentals": { "pe": 28.5, "eps": 6.15, ... },
  "analystConsensus": { "rating": "Buy", "buy": 25, "hold": 8, "sell": 2 },
  "prices": { "timestamps": [...], "close": [...], ... },
  "macd": { "macd": [...], "signal": [...], "histogram": [...] },
  "socialSentiment": { "timestamps": [...], "score": [...], "mentions": [...] },
  "meta": { "cached": true, "stale": false, "fetchedAt": "..." }
}
```

#### GET /api/prices?symbol=AAPL&range=1M&resolution=D

Returns historical price data with flexible time ranges (1D, 5D, 1M, 3M, 6M, 1Y, 5Y).

#### GET /api/sentiment?symbol=AAPL&range=1M

Returns social sentiment data. Falls back to simulated data if unavailable.

### Caching Strategy

Redis caching with intelligent TTLs:

| Data Type          | TTL        | Reason                    |
| ------------------ | ---------- | ------------------------- |
| Company Profile    | 30 minutes | Rarely changes            |
| Fundamentals       | 30 minutes | Quarterly updates         |
| Analyst Consensus  | 30 minutes | Infrequent updates        |
| Stock Prices       | 5 minutes  | Balance freshness & limits|
| Social Sentiment   | 5 minutes  | More dynamic data         |

### Error Handling

- **Retry Logic**: 3 attempts with exponential backoff (100ms, 200ms, 400ms)
- **Circuit Breaker**: After 5 consecutive failures, serves stale cache for 5 minutes
- **Graceful Degradation**: Works without Redis (no-cache mode)
- **User-Friendly Messages**: Technical errors translated to helpful messages

### MACD Calculation

Server-side calculation using Exponential Moving Averages (EMA):

```
1. Fast EMA (12 periods) of close prices
2. Slow EMA (26 periods) of close prices
3. MACD Line = Fast EMA - Slow EMA
4. Signal Line = EMA (9 periods) of MACD Line
5. Histogram = MACD Line - Signal Line
```

**Formula:**
```
Multiplier = 2 / (period + 1)
EMA[today] = (close[today] - EMA[yesterday]) * multiplier + EMA[yesterday]
EMA[first] = SMA of first 'period' values
```

### Testing

Run all tests:

```bash
npm test
```

Watch mode:

```bash
npm run test:watch
```

Coverage report:

```bash
npm run test:coverage
```

### Docker Deployment

#### Build Image

```bash
docker build -t stock-dashboard .
```

#### Run with Docker Compose

```bash
docker-compose up -d
```

Services:
- **App**: http://localhost:3000
- **Redis**: localhost:6379
- **PostgreSQL**: localhost:5432

### Architecture

```
Frontend (Next.js + React)
  ↓
API Routes (Next.js Server)
  ↓
Redis Cache Layer (with circuit breaker)
  ↓
Finnhub API Client (with retry logic)
  ↓
Finnhub API
```

### File Structure

```
lib/
  ├── finnhub.ts              # Finnhub API client
  ├── finnhub-mock-data.ts    # Mock data for development
  ├── redis.ts                # Redis cache client
  ├── stockUtils.ts           # MACD/EMA calculations
  ├── chartUtils.ts           # Chart data transformations
  └── validations/stock.ts    # Zod schemas

app/api/
  ├── company/route.ts        # Company data endpoint
  ├── prices/route.ts         # Historical prices endpoint
  └── sentiment/route.ts      # Social sentiment endpoint

app/(protected)/company/[symbol]/
  ├── page.tsx                # Main dashboard page
  ├── loading.tsx             # Loading state
  └── error.tsx               # Error boundary

components/stock/
  ├── company-header.tsx      # Company profile header
  ├── fundamentals-panel.tsx  # Key metrics display
  ├── price-chart.tsx         # Stock price chart
  ├── macd-chart.tsx          # MACD indicator chart
  ├── sentiment-chart.tsx     # Social sentiment chart
  ├── comparison-chart.tsx    # MACD vs sentiment overlay
  ├── analyst-panel.tsx       # Analyst consensus
  ├── ticker-search.tsx       # Ticker symbol search
  ├── chart-export-button.tsx # CSV/PNG export
  └── error-message.tsx       # Friendly error display
```

### Troubleshooting

#### "Finnhub API rate limit exceeded"

Wait 60 seconds or use cached data. Consider upgrading your Finnhub plan.

#### "Redis connection failed"

Check Redis is running:

```bash
redis-cli ping  # Should return "PONG"
```

The app will work in no-cache mode if Redis is unavailable.

#### "Invalid ticker symbol"

Ensure symbol is 1-5 uppercase letters (e.g., "AAPL", "MSFT", "GOOGL").

### Contributing

When adding new features:

1. Run tests before committing
2. Follow TypeScript strict mode
3. Add tests for new functionality
4. Update documentation
5. Ensure ESLint and Prettier pass

## Author

Created by [@miickasmt](https://twitter.com/miickasmt) in 2023, released under the [MIT license](https://github.com/shadcn/taxonomy/blob/main/LICENSE.md).

## Credits

This project was inspired by shadcn's [Taxonomy](https://github.com/shadcn-ui/taxonomy), Steven Tey’s [Precedent](https://github.com/steven-tey/precedent), and Antonio Erdeljac's [Next 13 AI SaaS](https://github.com/AntonioErdeljac/next13-ai-saas).

- Shadcn ([@shadcn](https://twitter.com/shadcn))
- Steven Tey ([@steventey](https://twitter.com/steventey))
- Antonio Erdeljac ([@YTCodeAntonio](https://twitter.com/AntonioErdeljac))

"use client";

import { formatCurrency, formatLargeNumber, formatPercentage } from "@/lib/chartUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface FundamentalsPanelProps {
  fundamentals: {
    pe?: number;
    eps?: number;
    revenue?: number;
    dividendYield?: number;
    beta?: number;
    high52Week?: number;
    low52Week?: number;
  };
}

interface MetricCardProps {
  label: string;
  value: string | number | undefined;
  formatter?: (value: number) => string;
}

function MetricCard({ label, value, formatter }: MetricCardProps) {
  const formattedValue =
    value !== undefined && value !== null
      ? formatter && typeof value === "number"
        ? formatter(value)
        : String(value)
      : "N/A";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
      </CardContent>
    </Card>
  );
}

export function FundamentalsPanel({ fundamentals }: FundamentalsPanelProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <MetricCard
        label="P/E Ratio"
        value={fundamentals.pe}
        formatter={(val) => val.toFixed(2)}
      />
      <MetricCard
        label="EPS"
        value={fundamentals.eps}
        formatter={formatCurrency}
      />
      <MetricCard
        label="Revenue (TTM)"
        value={fundamentals.revenue}
        formatter={formatLargeNumber}
      />
      <MetricCard
        label="Dividend Yield"
        value={fundamentals.dividendYield}
        formatter={formatPercentage}
      />
      <MetricCard
        label="Beta"
        value={fundamentals.beta}
        formatter={(val) => val.toFixed(2)}
      />
      <MetricCard
        label="52W High"
        value={fundamentals.high52Week}
        formatter={formatCurrency}
      />
      <MetricCard
        label="52W Low"
        value={fundamentals.low52Week}
        formatter={formatCurrency}
      />
    </div>
  );
}

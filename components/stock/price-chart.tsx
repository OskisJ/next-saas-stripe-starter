"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { formatTimestamp, formatCurrency } from "@/lib/chartUtils";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportButton } from "./chart-export-button";

export interface PriceChartProps {
  data: {
    timestamps: number[];
    close: number[];
    high: number[];
    low: number[];
  };
  symbol: string;
}

const chartConfig = {
  close: {
    label: "Close Price",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function PriceChart({ data, symbol }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.timestamps.map((timestamp, i) => ({
      date: formatTimestamp(timestamp, "short"),
      timestamp,
      close: data.close[i],
      high: data.high[i],
      low: data.low[i],
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{symbol} Price Chart</CardTitle>
        <ChartExportButton
          data={{
            Date: data.timestamps.map((t) => formatTimestamp(t, "long")),
            Close: data.close,
            High: data.high,
            Low: data.low,
          }}
          filename={`${symbol}_price_chart`}
        />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillClose" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-close)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-close)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatCurrency(value)}
              className="text-xs"
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    if (payload && payload[0]) {
                      return formatTimestamp(
                        payload[0].payload.timestamp,
                        "long"
                      );
                    }
                    return "";
                  }}
                  formatter={(value) => formatCurrency(Number(value))}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="close"
              stroke="var(--color-close)"
              fill="url(#fillClose)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

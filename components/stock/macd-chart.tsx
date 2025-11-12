"use client";

import { useMemo } from "react";
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { formatTimestamp } from "@/lib/chartUtils";
import { Info } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ChartExportButton } from "./chart-export-button";

export interface MACDChartProps {
  data: {
    timestamps: number[];
    macd: number[];
    signal: number[];
    histogram: number[];
  };
  symbol: string;
}

const chartConfig = {
  macd: {
    label: "MACD",
    color: "hsl(var(--chart-1))",
  },
  signal: {
    label: "Signal",
    color: "hsl(var(--chart-2))",
  },
  histogram: {
    label: "Histogram",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function MACDChart({ data, symbol }: MACDChartProps) {
  const chartData = useMemo(() => {
    return data.timestamps.map((timestamp, i) => ({
      date: formatTimestamp(timestamp, "short"),
      timestamp,
      macd: data.macd[i],
      signal: data.signal[i],
      histogram: data.histogram[i],
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CardTitle>MACD Indicator</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>
                  MACD (12,26,9) measures momentum using moving average
                  convergence/divergence. Positive histogram indicates bullish
                  momentum.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <ChartExportButton
          data={{
            Date: data.timestamps.map((t) => formatTimestamp(t, "long")),
            MACD: data.macd,
            Signal: data.signal,
            Histogram: data.histogram,
          }}
          filename={`${symbol}_macd_chart`}
        />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ComposedChart data={chartData}>
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
                  formatter={(value) => Number(value).toFixed(2)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {/* Histogram bars */}
            <Bar
              dataKey="histogram"
              fill={(entry: any) =>
                entry.histogram >= 0
                  ? "hsl(var(--chart-5))"
                  : "hsl(var(--chart-4))"
              }
              radius={[4, 4, 0, 0]}
            />
            {/* MACD and Signal lines */}
            <Line
              type="monotone"
              dataKey="macd"
              stroke="var(--color-macd)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="signal"
              stroke="var(--color-signal)"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

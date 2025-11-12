"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { formatTimestamp } from "@/lib/chartUtils";
import { normalizeToScale, alignTimeSeries } from "@/lib/chartUtils";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartExportButton } from "./chart-export-button";

export interface ComparisonChartProps {
  macdData: {
    timestamps: number[];
    macd: number[];
  };
  sentimentData: {
    timestamps: number[];
    score: number[];
  };
  symbol: string;
}

const chartConfig = {
  macd: {
    label: "MACD (normalized)",
    color: "hsl(var(--chart-1))",
  },
  sentiment: {
    label: "Social Sentiment",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function ComparisonChart({
  macdData,
  sentimentData,
  symbol,
}: ComparisonChartProps) {
  const chartData = useMemo(() => {
    // Align time series
    const aligned = alignTimeSeries(
      { timestamps: macdData.timestamps, values: macdData.macd },
      { timestamps: sentimentData.timestamps, values: sentimentData.score }
    );

    // Normalize MACD to 0-1 scale (sentiment already in 0-1)
    const normalizedMACD = normalizeToScale(aligned.series1Values);

    return aligned.timestamps.map((timestamp, i) => ({
      date: formatTimestamp(timestamp, "short"),
      timestamp,
      macd: normalizedMACD[i],
      sentiment: aligned.series2Values[i],
    }));
  }, [macdData, sentimentData]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>MACD vs Sentiment</CardTitle>
          <CardDescription className="text-xs mt-1">
            Both metrics normalized to 0-1 scale for visual correlation
          </CardDescription>
        </div>
        <ChartExportButton
          data={{
            Date: chartData.map((d) =>
              formatTimestamp(d.timestamp, "long")
            ),
            "MACD (normalized)": chartData.map((d) => d.macd),
            "Sentiment": chartData.map((d) => d.sentiment),
          }}
          filename={`${symbol}_comparison_chart`}
        />
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              className="text-xs"
            />
            <YAxis
              domain={[0, 1]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toFixed(1)}
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
                  formatter={(value) => Number(value).toFixed(3)}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              type="monotone"
              dataKey="macd"
              stroke="var(--color-macd)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="sentiment"
              stroke="var(--color-sentiment)"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, XAxis, YAxis } from "recharts";
import { formatTimestamp, formatPercentage } from "@/lib/chartUtils";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { ChartExportButton } from "./chart-export-button";

export interface SentimentChartProps {
  data: {
    timestamps: number[];
    score: number[];
    mentions: number[];
  };
  symbol: string;
  isSimulated?: boolean;
}

const chartConfig = {
  score: {
    label: "Sentiment Score",
    color: "hsl(var(--chart-3))",
  },
} satisfies ChartConfig;

export function SentimentChart({
  data,
  symbol,
  isSimulated = false,
}: SentimentChartProps) {
  const chartData = useMemo(() => {
    return data.timestamps.map((timestamp, i) => ({
      date: formatTimestamp(timestamp, "short"),
      timestamp,
      score: data.score[i],
      mentions: data.mentions[i],
    }));
  }, [data]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Social Sentiment</CardTitle>
        <ChartExportButton
          data={{
            Date: data.timestamps.map((t) => formatTimestamp(t, "long")),
            Score: data.score,
            Mentions: data.mentions,
          }}
          filename={`${symbol}_sentiment_chart`}
        />
      </CardHeader>
      <CardContent>
        {isSimulated && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Social sentiment data simulated based on price volatility (not
              available for your API tier).
            </AlertDescription>
          </Alert>
        )}

        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="fillScore" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-score)"
                  stopOpacity={0.3}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-score)"
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
              domain={[0, 1]}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => formatPercentage(value, 0)}
              className="text-xs"
            />
            {/* Reference line at neutral sentiment (0.5) */}
            <ReferenceLine
              y={0.5}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
              label={{ value: "Neutral", position: "insideTopRight" }}
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
                  formatter={(value, name) => {
                    if (name === "score") {
                      return `${(Number(value) * 100).toFixed(0)}% positive`;
                    }
                    return value;
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Area
              type="monotone"
              dataKey="score"
              stroke="var(--color-score)"
              fill="url(#fillScore)"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

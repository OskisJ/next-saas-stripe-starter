"use client";

import { formatCurrency } from "@/lib/chartUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface AnalystPanelProps {
  consensus: {
    rating: string;
    targetPriceHigh?: number;
    targetPriceLow?: number;
    targetPriceAverage?: number;
    buy: number;
    hold: number;
    sell: number;
  };
}

/**
 * Get badge variant based on rating
 */
function getRatingVariant(rating: string): "default" | "destructive" | "secondary" {
  if (rating.includes("Buy")) return "default";
  if (rating.includes("Sell")) return "destructive";
  return "secondary";
}

export function AnalystPanel({ consensus }: AnalystPanelProps) {
  const total = consensus.buy + consensus.hold + consensus.sell;

  // Calculate percentages for visualization
  const buyPercent = total > 0 ? (consensus.buy / total) * 100 : 0;
  const holdPercent = total > 0 ? (consensus.hold / total) * 100 : 0;
  const sellPercent = total > 0 ? (consensus.sell / total) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyst Consensus</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Rating */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">Rating</p>
          <Badge variant={getRatingVariant(consensus.rating)} className="text-base">
            {consensus.rating}
          </Badge>
        </div>

        {/* Price Targets */}
        {(consensus.targetPriceAverage ||
          consensus.targetPriceHigh ||
          consensus.targetPriceLow) && (
          <div>
            <p className="mb-2 text-sm text-muted-foreground">Price Target</p>
            <div className="space-y-1">
              {consensus.targetPriceLow && consensus.targetPriceHigh && (
                <p className="text-sm">
                  Range: {formatCurrency(consensus.targetPriceLow)} -{" "}
                  {formatCurrency(consensus.targetPriceHigh)}
                </p>
              )}
              {consensus.targetPriceAverage && (
                <p className="text-lg font-semibold">
                  Average: {formatCurrency(consensus.targetPriceAverage)}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Recommendations Distribution */}
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            Recommendations ({total} analysts)
          </p>

          {/* Visual bar */}
          {total > 0 && (
            <div className="mb-3 flex h-6 w-full overflow-hidden rounded-lg">
              {consensus.buy > 0 && (
                <div
                  className="bg-green-500"
                  style={{ width: `${buyPercent}%` }}
                  title={`Buy: ${consensus.buy}`}
                />
              )}
              {consensus.hold > 0 && (
                <div
                  className="bg-yellow-500"
                  style={{ width: `${holdPercent}%` }}
                  title={`Hold: ${consensus.hold}`}
                />
              )}
              {consensus.sell > 0 && (
                <div
                  className="bg-red-500"
                  style={{ width: `${sellPercent}%` }}
                  title={`Sell: ${consensus.sell}`}
                />
              )}
            </div>
          )}

          {/* Counts */}
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Buy</p>
              <p className="font-semibold text-green-600">{consensus.buy}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Hold</p>
              <p className="font-semibold text-yellow-600">{consensus.hold}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Sell</p>
              <p className="font-semibold text-red-600">{consensus.sell}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

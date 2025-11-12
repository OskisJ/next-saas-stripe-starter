"use client";

import Image from "next/image";
import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency, formatMarketCap } from "@/lib/chartUtils";
import { Card } from "@/components/ui/card";

export interface CompanyHeaderProps {
  profile: {
    symbol: string;
    name: string;
    logo?: string;
    industry?: string;
    marketCap?: number;
    weburl?: string;
  };
  currentPrice?: {
    price: number;
    change: number;
    changePercent: number;
  };
}

export function CompanyHeader({ profile, currentPrice }: CompanyHeaderProps) {
  const isPositive = currentPrice ? currentPrice.change >= 0 : false;

  // Generate fallback initials from company name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        {/* Left side: Logo and company info */}
        <div className="flex items-center gap-4">
          {/* Logo */}
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-background">
            {profile.logo ? (
              <Image
                src={profile.logo}
                alt={`${profile.name} logo`}
                width={64}
                height={64}
                className="object-contain"
              />
            ) : (
              <span className="text-xl font-bold text-muted-foreground">
                {getInitials(profile.name)}
              </span>
            )}
          </div>

          {/* Company name and details */}
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              {profile.name}
              <span className="ml-2 text-lg text-muted-foreground">
                ({profile.symbol})
              </span>
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-sm text-muted-foreground">
              {profile.industry && <span>{profile.industry}</span>}
              {profile.marketCap && (
                <>
                  <span>|</span>
                  <span>Market Cap: {formatMarketCap(profile.marketCap)}</span>
                </>
              )}
              {profile.weburl && (
                <>
                  <span>|</span>
                  <a
                    href={profile.weburl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    Website
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Current price */}
        {currentPrice && (
          <div className="flex flex-col items-start md:items-end">
            <div className="text-3xl font-bold">
              {formatCurrency(currentPrice.price)}
            </div>
            <div
              className={`mt-1 flex items-center gap-1 text-lg font-semibold ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span>
                {isPositive ? "+" : ""}
                {formatCurrency(currentPrice.change)} (
                {(currentPrice.changePercent * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

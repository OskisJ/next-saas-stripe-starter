"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface TickerSearchProps {
  initialValue?: string;
  onSelect?: (symbol: string) => void;
  className?: string;
}

export function TickerSearch({
  initialValue = "",
  onSelect,
  className,
}: TickerSearchProps) {
  const router = useRouter();
  const [symbol, setSymbol] = useState(initialValue);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate ticker symbol (1-5 uppercase letters)
    const trimmed = symbol.trim().toUpperCase();

    if (!trimmed) {
      setError("Please enter a ticker symbol");
      return;
    }

    if (!/^[A-Z]{1,5}$/.test(trimmed)) {
      setError("Invalid format. Use 1-5 letters (e.g., AAPL)");
      return;
    }

    setError("");

    if (onSelect) {
      onSelect(trimmed);
    } else {
      // Navigate to company page
      router.push(`/company/${trimmed}`);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setSymbol(value);
    setError(""); // Clear error on input
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="flex flex-col gap-2">
        <Label htmlFor="ticker-search" className="sr-only">
          Search ticker symbol
        </Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="ticker-search"
              type="text"
              placeholder="Enter ticker (e.g., AAPL)"
              value={symbol}
              onChange={handleChange}
              className="pl-9"
              maxLength={5}
              aria-invalid={!!error}
              aria-describedby={error ? "ticker-error" : undefined}
            />
          </div>
          <Button type="submit">Search</Button>
        </div>
        {error && (
          <p id="ticker-error" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </form>
  );
}

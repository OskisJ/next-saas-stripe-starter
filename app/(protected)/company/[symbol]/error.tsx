"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Error Boundary for Stock Dashboard Page
 *
 * Displays user-friendly error message with retry option
 */
export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (could also send to error reporting service)
    console.error("[Company Page Error]:", error);
  }, [error]);

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Hmm — we couldn't load the stock data. This could be due to:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-4">
            <li>Invalid ticker symbol</li>
            <li>Temporary API issues</li>
            <li>Network connection problems</li>
            <li>Rate limit exceeded</li>
          </ul>

          {error.message && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Technical details
              </summary>
              <pre className="mt-2 rounded bg-muted p-3 text-xs overflow-auto">
                {error.message}
              </pre>
            </details>
          )}

          <div className="flex gap-3 pt-4">
            <Button onClick={reset}>Try Again</Button>
            <Button variant="outline" asChild>
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

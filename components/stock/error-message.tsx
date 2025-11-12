"use client";

import { AlertCircle, XCircle, Info, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface ErrorMessageProps {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  onRetry?: () => void;
  onDismiss?: () => void;
}

/**
 * Map error codes to user-friendly messages
 */
const getFriendlyMessage = (code: string, originalMessage: string): string => {
  const messages: Record<string, string> = {
    INVALID_SYMBOL:
      "Hmm — this ticker symbol doesn't look quite right. Please use 1-5 uppercase letters (like AAPL or MSFT).",
    SYMBOL_NOT_FOUND:
      "We couldn't find that ticker symbol. Double-check the spelling and try again.",
    RATE_LIMIT_EXCEEDED:
      "Looks like we hit a rate limit. Take a quick breather and try again in a minute.",
    FINNHUB_ERROR:
      "Hmm — we couldn't fetch fresh data from Finnhub right now. Try again in a moment.",
    SERVICE_UNAVAILABLE:
      "The data service is temporarily unavailable, but we've got some cached data for you.",
    NETWORK_ERROR:
      "Connection hiccup! Check your internet connection and try again.",
    TIMEOUT: "The request took too long. Please try again.",
    NO_DATA: "No data available for this symbol and time range.",
    INTERNAL_ERROR: "Oops — something went wrong on our end. Please try again.",
  };

  return messages[code] || originalMessage;
};

/**
 * Get icon and styling based on error type
 */
const getErrorStyle = (code: string) => {
  if (code === "INVALID_SYMBOL" || code === "SYMBOL_NOT_FOUND") {
    return {
      icon: Info,
      variant: "default" as const,
      className: "border-blue-500 bg-blue-50 dark:bg-blue-950",
    };
  }

  if (code === "RATE_LIMIT_EXCEEDED" || code === "SERVICE_UNAVAILABLE") {
    return {
      icon: AlertTriangle,
      variant: "default" as const,
      className: "border-yellow-500 bg-yellow-50 dark:bg-yellow-950",
    };
  }

  if (code === "NO_DATA") {
    return {
      icon: AlertCircle,
      variant: "default" as const,
      className: "border-gray-500 bg-gray-50 dark:bg-gray-950",
    };
  }

  return {
    icon: XCircle,
    variant: "destructive" as const,
    className: "",
  };
};

export function ErrorMessage({ error, onRetry, onDismiss }: ErrorMessageProps) {
  const friendlyMessage = getFriendlyMessage(error.code, error.message);
  const { icon: Icon, variant, className } = getErrorStyle(error.code);

  return (
    <Alert variant={variant} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{friendlyMessage}</p>
        {error.details && (
          <details className="mb-3 text-xs opacity-70">
            <summary className="cursor-pointer hover:opacity-100">
              Technical details
            </summary>
            <pre className="mt-2 overflow-auto rounded bg-muted p-2">
              {JSON.stringify(error.details, null, 2)}
            </pre>
          </details>
        )}
        <div className="flex gap-2">
          {onRetry && (
            <Button size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {onDismiss && (
            <Button size="sm" variant="outline" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

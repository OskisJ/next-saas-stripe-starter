"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { convertToCSV, downloadCSV } from "@/lib/chartUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface ChartExportButtonProps {
  data: any;
  filename: string;
  className?: string;
}

/**
 * Export chart data to CSV format
 */
function exportToCSV(data: any, filename: string) {
  try {
    // Extract data based on structure
    const headers = Object.keys(data);
    const firstKey = headers[0];
    const length = Array.isArray(data[firstKey]) ? data[firstKey].length : 0;

    if (length === 0) {
      console.error("No data to export");
      return;
    }

    // Build rows
    const rows: string[][] = [];
    for (let i = 0; i < length; i++) {
      const row: string[] = [];
      for (const key of headers) {
        const value = data[key][i];
        row.push(String(value));
      }
      rows.push(row);
    }

    const csv = convertToCSV(headers, rows);
    downloadCSV(csv, `${filename}.csv`);
  } catch (error) {
    console.error("Failed to export CSV:", error);
  }
}

/**
 * Export chart as PNG (placeholder for future enhancement)
 */
function exportToPNG(filename: string) {
  // This would require html2canvas or similar library
  // For now, just show a message
  alert("PNG export coming soon! Use CSV export for now.");
}

export function ChartExportButton({
  data,
  filename,
  className,
}: ChartExportButtonProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
          aria-label="Export chart data"
        >
          <Download className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportToCSV(data, filename)}>
          <Download className="mr-2 h-4 w-4" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportToPNG(filename)}>
          <Download className="mr-2 h-4 w-4" />
          Export as PNG (Coming Soon)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

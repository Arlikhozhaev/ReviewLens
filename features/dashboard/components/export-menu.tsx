"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Database,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buildSummaryCsv, downloadTextFile } from "../utils/export-csv";
import type { StoredAnalysisResult } from "@/features/analysis/types";

interface ExportMenuProps {
  slug: string;
  fileName: string | null;
  totalReviews: number;
  result: StoredAnalysisResult;
}

function baseName(fileName: string | null): string {
  const stripped = fileName?.replace(/\.[^.]+$/, "").trim();
  return stripped && stripped.length > 0 ? stripped : "reviewlens-analysis";
}

export function ExportMenu({
  slug,
  fileName,
  totalReviews,
  result,
}: ExportMenuProps) {
  const [pdfBusy, setPdfBusy] = useState(false);
  const name = baseName(fileName);

  async function handlePdf() {
    setPdfBusy(true);
    try {
      const { buildAnalysisPdf } = await import("../utils/export-pdf");
      await buildAnalysisPdf({
        result,
        totalReviews,
        title: name,
        fileName: `${name}.pdf`,
      });
    } catch {
      toast.error("Could not generate PDF. Try again.");
    } finally {
      setPdfBusy(false);
    }
  }

  function handleSummaryCsv() {
    downloadTextFile(
      buildSummaryCsv(result, totalReviews),
      `${name}-summary.csv`
    );
  }

  function handleReviewsCsv() {
    // Streamed from the server (gated by share access for non-owners).
    window.location.href = `/api/analysis/${slug}/export?type=reviews`;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5" disabled={pdfBusy}>
          {pdfBusy ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Download report</DropdownMenuLabel>
        <DropdownMenuItem onClick={() => void handlePdf()}>
          <FileText className="mr-2 h-4 w-4" />
          PDF report
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleSummaryCsv}>
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Summary (CSV)
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleReviewsCsv}>
          <Database className="mr-2 h-4 w-4" />
          Raw reviews (CSV)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

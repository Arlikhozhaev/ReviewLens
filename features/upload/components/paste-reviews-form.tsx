"use client";

import { useMemo, useState } from "react";
import { ClipboardPaste, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import { MAX_REVIEWS_PER_ANALYSIS } from "@/lib/constants";
import { parsePastedReviews } from "../utils/parse-pasted-reviews";
import type { CsvParseResult } from "../types";

interface PasteReviewsFormProps {
  onParsed: (result: CsvParseResult, label: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER = `Paste reviews from Amazon, G2, App Store, or anywhere.

One review per paragraph:
Great battery life on the new model.

Slow shipping but product quality is fine.

Or one per line:
Excellent support team
Price feels too high
Works as advertised

Or paste CSV:
review,rating
"Love it",5
"Broken on arrival",1`;

export function PasteReviewsForm({ onParsed, disabled }: PasteReviewsFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);

  const charCount = text.length;
  const previewCount = useMemo(() => {
    if (!text.trim()) return 0;
    return parsePastedReviews(text).validRows;
  }, [text]);

  function handleParse() {
    setError(null);
    const result = parsePastedReviews(text);
    if (result.validRows === 0) {
      setError(result.errors[0]?.message ?? "Could not parse any reviews.");
      return;
    }
    onParsed(result, "Pasted reviews");
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground">
          <ClipboardPaste className="h-4 w-4 text-primary" />
          Paste from any source
        </p>
        <p className="mt-1 text-xs leading-relaxed">
          Copy reviews from a product page, spreadsheet, or doc. We accept paragraphs,
          line-by-line lists, or CSV with a <code className="rounded bg-muted px-1">review</code> column.
        </p>
      </div>

      <textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setError(null);
        }}
        placeholder={PLACEHOLDER}
        disabled={disabled}
        rows={14}
        className={cn(
          "w-full resize-y rounded-xl border border-input bg-background/80 px-4 py-3 text-sm shadow-sm",
          "placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {previewCount > 0
            ? `~${formatNumber(previewCount)} review${previewCount === 1 ? "" : "s"} detected`
            : "No reviews detected yet"}
          {" · "}
          max {formatNumber(MAX_REVIEWS_PER_ANALYSIS)} per analysis
        </span>
        <span>{formatNumber(charCount)} characters</span>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        type="button"
        className="w-full gap-2"
        onClick={handleParse}
        disabled={disabled || !text.trim()}
      >
        <Sparkles className="h-4 w-4" />
        Parse pasted reviews
      </Button>
    </div>
  );
}

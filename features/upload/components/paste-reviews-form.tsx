"use client";

import { useMemo, useState } from "react";
import { ArrowRight, ClipboardPaste, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";
import { MAX_REVIEWS_PER_ANALYSIS } from "@/lib/constants";
import { parsePastedReviews } from "../utils/parse-pasted-reviews";
import type { CsvParseResult } from "../types";

interface PasteReviewsFormProps {
  onParsed: (result: CsvParseResult, label: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER = `Paste reviews here — one per paragraph, one per line, or CSV with a review column.

Example:
Great battery life on the new model.

Slow shipping but the product quality is fine.

5/5 - Support team was incredibly helpful.`;

export function PasteReviewsForm({ onParsed, disabled }: PasteReviewsFormProps) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);

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
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300",
          "surface-glass shadow-lg",
          focused
            ? "border-primary/50 bg-primary/[0.03] glow-ring"
            : "border-border/85 bg-card/45 hover:border-primary/30 hover:bg-card/60",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <div className="flex items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <ClipboardPaste className="h-4 w-4 text-primary" aria-hidden />
          <span className="text-xs font-medium text-muted-foreground">
            Accepts paragraphs, line lists, ratings like{" "}
            <span className="font-mono text-[10px] text-foreground/80">5/5 - …</span>
            , or CSV
          </span>
        </div>

        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={PLACEHOLDER}
          disabled={disabled}
          rows={12}
          className={cn(
            "block w-full resize-none border-0 bg-transparent px-4 py-4 text-sm leading-relaxed",
            "placeholder:text-muted-foreground/50 focus-visible:outline-none",
            "min-h-[240px]"
          )}
        />

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground">
          <span>
            {previewCount > 0 ? (
              <>
                <span className="font-semibold text-foreground">
                  {formatNumber(previewCount)}
                </span>{" "}
                review{previewCount === 1 ? "" : "s"} detected
              </>
            ) : (
              "Start typing or paste from clipboard"
            )}
          </span>
          <span className="tabular-nums">
            {formatNumber(charCount)} chars · max{" "}
            {formatNumber(MAX_REVIEWS_PER_ANALYSIS)} reviews
          </span>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex justify-end">
        <Button
          type="button"
          size="lg"
          className="gap-2 px-6 shadow-md"
          onClick={handleParse}
          disabled={disabled || !text.trim()}
        >
          <Sparkles className="h-4 w-4" />
          Continue to preview
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

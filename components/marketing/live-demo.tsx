"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Loader2 } from "lucide-react";
import { useInView } from "@/lib/hooks/use-in-view";
import { useReducedMotion } from "@/lib/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

type DemoPhase = "input" | "analyzing" | "result";

interface ThemeRow {
  label: string;
  pct: number;
  sentiment: "negative" | "positive" | "mixed";
}

const RAW_REVIEWS = [
  "the battery doesn't last as long as advertised, dies by lunch",
  "really solid build, feels like it's worth the price",
  "took me a while to figure out the initial setup",
  "battery life has gotten worse after a month of use",
  "comfortable fit, wore them all day without issues",
] as const;

const RESULT_ROWS: ThemeRow[] = [
  { label: "Battery drains too fast", pct: 34, sentiment: "negative" },
  { label: "Excellent build quality", pct: 28, sentiment: "positive" },
  { label: "Setup instructions unclear", pct: 16, sentiment: "mixed" },
  { label: "Comfortable for all-day wear", pct: 11, sentiment: "positive" },
];

const SENTIMENT_COLOR: Record<ThemeRow["sentiment"], string> = {
  negative: "var(--sentiment-negative)",
  positive: "var(--sentiment-positive)",
  mixed: "var(--sentiment-mixed)",
};

const SENTIMENT_BG: Record<ThemeRow["sentiment"], string> = {
  negative: "var(--sentiment-negative-bg)",
  positive: "var(--sentiment-positive-bg)",
  mixed: "var(--sentiment-mixed-bg)",
};

const INPUT_PHASE_MS = 1_800;
const ANALYZING_PHASE_MS = 2_000;

export function LiveDemo() {
  const { ref, isInView } = useInView<HTMLDivElement>({ threshold: 0.35 });
  const prefersReducedMotion = useReducedMotion();
  const [phase, setPhase] = useState<DemoPhase>("input");

  useEffect(() => {
    if (!isInView) return;

    if (prefersReducedMotion) {
      setPhase("result");
      return;
    }

    setPhase("input");
    const toAnalyzing = setTimeout(() => setPhase("analyzing"), INPUT_PHASE_MS);
    const toResult = setTimeout(
      () => setPhase("result"),
      INPUT_PHASE_MS + ANALYZING_PHASE_MS
    );

    return () => {
      clearTimeout(toAnalyzing);
      clearTimeout(toResult);
    };
  }, [isInView, prefersReducedMotion]);

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={cn(
        "surface-glass w-full max-w-md overflow-hidden",
        isInView && "animate-fade-up"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">reviews.csv</span>
        </div>
        <span className="rounded-md bg-brand-muted px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
          1,284 rows
        </span>
      </div>

      <div className="min-h-[240px] px-5 py-5">
        {phase === "input" && (
          <div className="space-y-2">
            <p className="mb-3 text-xs font-medium text-muted-foreground">
              Raw review text
            </p>
            {RAW_REVIEWS.map((text, i) => (
              <p
                key={text}
                className="truncate rounded-lg border border-border/40 bg-muted/20 px-3 py-2 font-mono text-[11px] text-muted-foreground"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                &ldquo;{text}&rdquo;
              </p>
            ))}
          </div>
        )}

        {phase === "analyzing" && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-sm font-medium">Analyzing reviews…</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Clustering similar feedback
              </p>
            </div>
            <div className="h-1.5 w-full max-w-[200px] overflow-hidden rounded-full bg-muted">
              <div className="h-full w-full origin-left rounded-full bg-primary animate-fill-bar" />
            </div>
          </div>
        )}

        {phase === "result" && (
          <div>
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2
                className="h-4 w-4 text-[var(--sentiment-positive)]"
                aria-hidden
              />
              <p className="text-xs font-medium text-[var(--sentiment-positive)]">
                Analysis complete
              </p>
            </div>
            <div className="space-y-3">
              {RESULT_ROWS.map((row, i) => (
                <div
                  key={row.label}
                  className="animate-fade-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium">
                      {row.label}
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style={{
                        color: SENTIMENT_COLOR[row.sentiment],
                        backgroundColor: SENTIMENT_BG[row.sentiment],
                      }}
                    >
                      {row.pct}%
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${row.pct}%`,
                        backgroundColor: SENTIMENT_COLOR[row.sentiment],
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

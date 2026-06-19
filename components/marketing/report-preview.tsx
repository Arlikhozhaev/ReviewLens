type PreviewSentiment = "negative" | "positive" | "mixed" | "neutral";

interface PreviewRow {
  label: string;
  pct: number;
  sentiment: PreviewSentiment;
}

interface SentimentSlice {
  label: string;
  pct: number;
  color: string;
}

const PREVIEW_ROWS: PreviewRow[] = [
  {
    label: "Battery drains too fast",
    pct: 34,
    sentiment: "negative",
  },
  {
    label: "Excellent build quality",
    pct: 28,
    sentiment: "positive",
  },
  {
    label: "Setup instructions unclear",
    pct: 16,
    sentiment: "mixed",
  },
  {
    label: "Fast shipping & packaging",
    pct: 12,
    sentiment: "positive",
  },
];

const SENTIMENT_SLICES: SentimentSlice[] = [
  { label: "Positive", pct: 42, color: "var(--sentiment-positive)" },
  { label: "Negative", pct: 31, color: "var(--sentiment-negative)" },
  { label: "Mixed", pct: 18, color: "var(--sentiment-mixed)" },
  { label: "Neutral", pct: 9, color: "var(--sentiment-neutral)" },
];

const SENTIMENT_COLOR: Record<PreviewSentiment, string> = {
  negative: "var(--sentiment-negative)",
  positive: "var(--sentiment-positive)",
  mixed: "var(--sentiment-mixed)",
  neutral: "var(--sentiment-neutral)",
};

const SENTIMENT_BG: Record<PreviewSentiment, string> = {
  negative: "var(--sentiment-negative-bg)",
  positive: "var(--sentiment-positive-bg)",
  mixed: "var(--sentiment-mixed-bg)",
  neutral: "var(--sentiment-neutral-bg)",
};

export function ReportPreview() {
  return (
    <div className="surface-glass overflow-hidden text-left">
      {/* Window chrome */}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </div>
          <span className="text-xs font-medium text-foreground">
            Wireless Earbuds Pro — Analysis
          </span>
        </div>
        <span className="rounded-md bg-brand-muted px-2 py-0.5 font-mono text-[10px] font-medium text-primary">
          1,284 reviews
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1fr_220px]">
        {/* Themes */}
        <div className="border-b border-border/60 p-5 md:border-b-0 md:border-r">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-label">Top themes</span>
            <span className="text-[10px] text-muted-foreground">
              By mention frequency
            </span>
          </div>

          <div className="space-y-3">
            {PREVIEW_ROWS.map((row, i) => (
              <div key={row.label} className="group">
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-muted font-mono text-[10px] font-bold text-muted-foreground">
                      {i + 1}
                    </span>
                    <span className="truncate text-sm font-medium">
                      {row.label}
                    </span>
                  </div>
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
                    className="h-full rounded-full transition-all duration-700"
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

        {/* Sentiment + summary */}
        <div className="flex flex-col p-5">
          <span className="text-label mb-3">Sentiment</span>

          <div className="relative mx-auto mb-4 h-24 w-24">
            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
              {(() => {
                let offset = 0;
                return SENTIMENT_SLICES.map((slice) => {
                  const dash = slice.pct;
                  const gap = 100 - dash;
                  const el = (
                    <circle
                      key={slice.label}
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke={slice.color}
                      strokeWidth="4"
                      strokeDasharray={`${dash} ${gap}`}
                      strokeDashoffset={-offset}
                      strokeLinecap="round"
                    />
                  );
                  offset += dash;
                  return el;
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold tabular-nums">42%</span>
              <span className="text-[9px] text-muted-foreground">positive</span>
            </div>
          </div>

          <div className="mb-4 space-y-1.5">
            {SENTIMENT_SLICES.map((slice) => (
              <div
                key={slice.label}
                className="flex items-center justify-between text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-muted-foreground">{slice.label}</span>
                </div>
                <span className="font-mono tabular-nums">{slice.pct}%</span>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-xl border border-border/60 bg-muted/20 p-3">
            <span className="text-label mb-1.5 block">Summary</span>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Build quality wins praise, but battery life is the dominant
              complaint — fix that and sentiment shifts fast.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

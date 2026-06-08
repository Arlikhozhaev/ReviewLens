"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiFetch, apiPost } from "@/lib/api";
import { formatNumber, formatPercent, truncate } from "@/lib/utils";
import type { AnalysisStatusResponse } from "@/app/api/analysis/[id]/status/route";
import type { ThemeAnalysis } from "@/features/analysis/types";

interface Props {
  params: { id: string };
}

const POLL_INTERVAL_MS = 2_500;

export default function DashboardPage({ params }: Props) {
  const { id: slug } = params;
  const router = useRouter();

  const [statusData, setStatusData] = useState<AnalysisStatusResponse | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (): Promise<string> => {
    try {
      const data = await apiFetch<AnalysisStatusResponse>(
        `/api/analysis/${slug}/status`
      );
      setStatusData(data);
      return data.status;
    } catch {
      setPageError("Could not reach the server. Check your connection.");
      return "FAILED";
    }
  }, [slug]);

  useEffect(() => {
    async function init() {
      // First: fetch current status
      const current = await fetchStatus();

      // If already done, nothing else to do
      if (current === "COMPLETED" || current === "FAILED") return;

      // If PENDING, trigger the pipeline
      if (current === "PENDING") {
        try {
          await apiPost(`/api/analysis/${slug}/process`, {});
        } catch {
          // Non-fatal — pipeline may already be running
        }
      }

      // Start polling
      intervalRef.current = setInterval(async () => {
        const status = await fetchStatus();
        if (status === "COMPLETED" || status === "FAILED") {
          stopPolling();
        }
      }, POLL_INTERVAL_MS);
    }

    void init();
    return () => stopPolling();
  }, [slug, fetchStatus, stopPolling]);

  // ── Error state ─────────────────────────────────────────────────────────────

  if (pageError) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-sm text-destructive">{pageError}</p>
          <Button variant="outline" onClick={() => router.push("/analyze")}>
            Try again
          </Button>
        </div>
      </Shell>
    );
  }

  // ── Processing state ────────────────────────────────────────────────────────

  if (
    !statusData ||
    statusData.status === "PENDING" ||
    statusData.status === "PROCESSING"
  ) {
    return <ProcessingScreen totalReviews={statusData?.totalReviews} />;
  }

  // ── Failed state ────────────────────────────────────────────────────────────

  if (statusData.status === "FAILED") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold">Analysis failed</p>
          <p className="text-sm text-muted-foreground max-w-sm">
            Something went wrong during AI processing. Check your OpenAI API
            key and billing status, then try again.
          </p>
          <Button onClick={() => router.push("/analyze")}>Upload again</Button>
        </div>
      </Shell>
    );
  }

  // ── Completed state ─────────────────────────────────────────────────────────

  const { result } = statusData;
  if (!result) return null;

  const sortedThemes = [...result.themes].sort(
    (a, b) => b.reviewCount - a.reviewCount
  );
  const complaints = sortedThemes.filter((t) => t.sentiment === "negative");
  const praises = sortedThemes.filter((t) => t.sentiment === "positive");
  const mixed = sortedThemes.filter(
    (t) => t.sentiment === "neutral" || t.sentiment === "mixed"
  );

  return (
    <Shell>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Analysis Results
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(statusData.totalReviews)} reviews ·{" "}
            {result.themes.length} themes ·{" "}
            {(result.processingMs / 1_000).toFixed(1)}s
            {result.averageRating &&
              ` · ${result.averageRating.toFixed(1)}★ avg`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5"
          onClick={() => router.push("/analyze")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          New analysis
        </Button>
      </div>

      <Separator />

      {/* ── Executive summary ─────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
        </CardContent>
      </Card>

      {/* ── Sentiment breakdown ───────────────────────────────────────────── */}
      <section>
        <h2 className="mb-3 text-sm font-semibold">Sentiment breakdown</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              { key: "positive", label: "Positive", cls: "text-emerald-600 dark:text-emerald-400" },
              { key: "negative", label: "Negative", cls: "text-red-600 dark:text-red-400" },
              { key: "neutral", label: "Neutral", cls: "text-muted-foreground" },
              { key: "mixed", label: "Mixed", cls: "text-amber-600 dark:text-amber-400" },
            ] as const
          ).map(({ key, label, cls }) => (
            <div
              key={key}
              className="rounded-xl border border-border bg-muted/30 p-4"
            >
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`mt-1 text-2xl font-bold tabular-nums ${cls}`}>
                {result.sentimentBreakdown[key]}%
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Top complaints ────────────────────────────────────────────────── */}
      {complaints.length > 0 && (
        <ThemeSection
          title="Top complaints"
          themes={complaints}
          accent="red"
        />
      )}

      {/* ── Top praises ───────────────────────────────────────────────────── */}
      {praises.length > 0 && (
        <ThemeSection title="Top praises" themes={praises} accent="emerald" />
      )}

      {/* ── Other themes ──────────────────────────────────────────────────── */}
      {mixed.length > 0 && (
        <ThemeSection title="Other themes" themes={mixed} accent="zinc" />
      )}
    </Shell>
  );
}

// ── Layout shell ──────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl space-y-6 py-10">{children}</main>
    </div>
  );
}

// ── Processing screen ─────────────────────────────────────────────────────────

function ProcessingScreen({ totalReviews }: { totalReviews?: number }) {
  const steps = [
    "Generating embeddings",
    "Clustering reviews",
    "Summarizing themes",
  ];
  const [stepIdx, setStepIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }, 4_000);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 flex-col items-center justify-center gap-8 text-center">
        <LoadingSpinner size="lg" />
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">
            Analyzing{" "}
            {totalReviews ? `${formatNumber(totalReviews)} reviews` : "your reviews"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {steps[stepIdx]}…
          </p>
        </div>
        <div className="w-full max-w-xs space-y-1.5">
          <Progress value={((stepIdx + 1) / steps.length) * 85} className="h-1" />
          <p className="text-xs text-muted-foreground">
            This takes 10–30 seconds
          </p>
        </div>
      </main>
    </div>
  );
}

// ── Theme section ─────────────────────────────────────────────────────────────

type Accent = "red" | "emerald" | "zinc";

function ThemeSection({
  title,
  themes,
  accent,
}: {
  title: string;
  themes: ThemeAnalysis[];
  accent: Accent;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {themes.map((theme) => (
          <ThemeCard key={theme.clusterId} theme={theme} accent={accent} />
        ))}
      </div>
    </section>
  );
}

// ── Theme card ────────────────────────────────────────────────────────────────

// ── Theme card ────────────────────────────────────────────────────────────────

type AccentStyle = { bar: string; badge: string; quote: string };

const ACCENT_STYLES: Record<Accent, AccentStyle> = {
  red: {
    bar: "bg-red-500",
    badge:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
    quote: "border-red-200 dark:border-red-900",
  },
  emerald: {
    bar: "bg-emerald-500",
    badge:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
    quote: "border-emerald-200 dark:border-emerald-900",
  },
  zinc: {
    bar: "bg-zinc-400",
    badge: "border-border bg-muted text-muted-foreground",
    quote: "border-border",
  },
};

function ThemeCard({
  theme,
  accent,
}: {
  theme: ThemeAnalysis;
  accent: Accent;
}) {
  const styles = ACCENT_STYLES[accent];

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">
            {theme.label}
          </CardTitle>
          <span
            className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles.badge}`}
          >
            {formatPercent(theme.percentage, 0)}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {theme.description}
        </p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pt-0">
        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={`h-full rounded-full ${styles.bar}`}
              style={{ width: `${Math.min(theme.percentage, 100)}%` }}
            />
          </div>
          <span className="shrink-0 font-mono text-xs text-muted-foreground">
            {formatNumber(theme.reviewCount)}
          </span>
        </div>

        {/* Example quotes */}
        {theme.exampleQuotes.slice(0, 2).map((quote, i) => (
          <blockquote
            key={i}
            className={`border-l-2 pl-3 text-xs italic leading-relaxed text-muted-foreground ${styles.quote}`}
          >
            &ldquo;{truncate(quote, 180)}&rdquo;
          </blockquote>
        ))}
      </CardContent>
    </Card>
  );
}
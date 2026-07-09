"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  RotateCcw,
  BarChart3,
  Clock,
  Hash,
  Star,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { apiFetch, apiPost, ApiError } from "@/lib/api";
import {
  PIPELINE_UI_TIMEOUT_MS,
  STATUS_POLL_INTERVAL_MS,
} from "@/lib/constants";
import { formatEstimateRange } from "@/lib/pipeline-estimate";
import { cn, formatNumber, formatPercent, truncate } from "@/lib/utils";
import {
  SentimentChart,
  ThemeBarChart,
  ShareButton,
  ExportMenu,
  ShareSettingsDialog,
} from "@/features/dashboard";
import type { AnalysisStatusResponse } from "@/app/api/analysis/[id]/status/route";
import type { ThemeAnalysis } from "@/features/analysis/types";
import type { StoredAnalysisResult } from "@/features/analysis/types";

type AnalysisStatus = AnalysisStatusResponse["status"];

interface DashboardClientProps {
  slug: string;
  sessionId: string;
  fileName: string | null;
  isOwner: boolean;
  hasSharePassword: boolean;
  shareExpiresAt: string | null;
  initialStatus: AnalysisStatus;
  initialTotalReviews: number;
  initialResult: StoredAnalysisResult | null;
}

export function DashboardClient({
  slug,
  sessionId,
  fileName,
  isOwner,
  hasSharePassword,
  shareExpiresAt,
  initialStatus,
  initialTotalReviews,
  initialResult,
}: DashboardClientProps) {
  const router = useRouter();

  const [status, setStatus] = useState<AnalysisStatus>(initialStatus);
  const [totalReviews, setTotalReviews] = useState(initialTotalReviews);
  const [result, setResult] = useState<StoredAnalysisResult | null>(
    initialResult
  );
  const [pageError, setPageError] = useState<string | null>(null);
  const [isSlow, setIsSlow] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedRef = useRef<NodeJS.Timeout | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (elapsedRef.current) {
      clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  }, []);

  const fetchStatus = useCallback(async (): Promise<AnalysisStatus> => {
    const data = await apiFetch<AnalysisStatusResponse>(
      `/api/analysis/${slug}/status`,
      { credentials: "include" }
    );
    setStatus(data.status);
    setTotalReviews(data.totalReviews);
    if (data.result) setResult(data.result);
    if (data.isStale) setIsSlow(true);
    return data.status;
  }, [slug]);

  const startPipeline = useCallback(async () => {
    if (!isOwner) return;

    try {
      await apiPost(`/api/analysis/${slug}/process`, {});
    } catch (err) {
      if (err instanceof ApiError && err.code === "RATE_LIMITED") {
        setPageError(err.message);
      }
      // Non-fatal — pipeline may already be running
    }
  }, [slug, isOwner]);

  const retryAnalysis = useCallback(async () => {
    setPageError(null);
    setIsSlow(false);
    startedAtRef.current = Date.now();
    setElapsedSec(0);
    await startPipeline();
  }, [startPipeline]);

  useEffect(() => {
    if (initialStatus === "COMPLETED" || initialStatus === "FAILED") return;

    elapsedRef.current = setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      setElapsedSec(Math.floor(elapsed / 1_000));
      if (elapsed >= PIPELINE_UI_TIMEOUT_MS) setIsSlow(true);
    }, 1_000);

    async function init() {
      if (
        isOwner &&
        (initialStatus === "PENDING" || initialStatus === "PROCESSING")
      ) {
        await startPipeline();
      }

      try {
        const current = await fetchStatus();
        if (current === "COMPLETED" || current === "FAILED") {
          stopPolling();
          return;
        }
      } catch (err) {
        if (err instanceof ApiError && err.statusCode === 401) {
          setPageError(
            "Share access expired. Refresh the page and enter the password again."
          );
        } else {
          setPageError(
            err instanceof ApiError
              ? err.message
              : "Could not reach the server. Check your connection."
          );
        }
        stopPolling();
        return;
      }

      intervalRef.current = setInterval(async () => {
        try {
          const current = await fetchStatus();
          if (current === "COMPLETED" || current === "FAILED") {
            stopPolling();
          }
        } catch {
          // Transient poll failure — keep trying, don't mark as FAILED
        }
      }, STATUS_POLL_INTERVAL_MS);
    }

    void init();
    return () => stopPolling();
  }, [
    slug,
    isOwner,
    initialStatus,
    fetchStatus,
    startPipeline,
    stopPolling,
  ]);

  if (pageError) {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="max-w-sm text-sm text-destructive">{pageError}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void retryAnalysis()}>
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Retry
            </Button>
            <Button variant="ghost" onClick={() => router.push("/analyze")}>
              Upload again
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (status === "PENDING" || status === "PROCESSING") {
    return (
      <ProcessingScreen
        totalReviews={totalReviews}
        elapsedSec={elapsedSec}
        isSlow={isSlow}
        onRetry={() => void retryAnalysis()}
      />
    );
  }

  if (status === "FAILED") {
    return (
      <Shell>
        <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <p className="text-lg font-semibold">Analysis failed</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Something went wrong during AI processing. Check your OpenAI API
            key and billing, then try again.
          </p>
          <div className="flex gap-2">
            <Button onClick={() => void retryAnalysis()}>Retry analysis</Button>
            <Button variant="outline" onClick={() => router.push("/analyze")}>
              Upload again
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  if (!result) return null;

  return (
    <CompletedDashboard
      slug={slug}
      sessionId={sessionId}
      fileName={fileName}
      isOwner={isOwner}
      hasSharePassword={hasSharePassword}
      shareExpiresAt={shareExpiresAt}
      totalReviews={totalReviews}
      result={result}
      onNewAnalysis={() => router.push("/analyze")}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shell
// ─────────────────────────────────────────────────────────────────────────────

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-4xl space-y-6 py-10">{children}</main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Completed dashboard
// ─────────────────────────────────────────────────────────────────────────────

type ThemeFilter = "all" | "negative" | "positive" | "other";

function CompletedDashboard({
  slug,
  sessionId,
  fileName,
  isOwner,
  hasSharePassword,
  shareExpiresAt,
  totalReviews,
  result,
  onNewAnalysis,
}: {
  slug: string;
  sessionId: string;
  fileName: string | null;
  isOwner: boolean;
  hasSharePassword: boolean;
  shareExpiresAt: string | null;
  totalReviews: number;
  result: StoredAnalysisResult;
  onNewAnalysis: () => void;
}) {
  const [filter, setFilter] = useState<ThemeFilter>("all");

  const sorted = [...result.themes].sort(
    (a, b) => b.reviewCount - a.reviewCount
  );
  const complaints = sorted.filter((t) => t.sentiment === "negative");
  const praises = sorted.filter((t) => t.sentiment === "positive");
  const other = sorted.filter(
    (t) => t.sentiment === "neutral" || t.sentiment === "mixed"
  );

  const visible =
    filter === "negative"
      ? complaints
      : filter === "positive"
        ? praises
        : filter === "other"
          ? other
          : sorted;

  const filterOptions: { value: ThemeFilter; label: string; count: number }[] =
    [
      { value: "all", label: "All", count: sorted.length },
      { value: "negative", label: "Complaints", count: complaints.length },
      { value: "positive", label: "Praises", count: praises.length },
      ...(other.length > 0
        ? [{ value: "other" as ThemeFilter, label: "Other", count: other.length }]
        : []),
    ];

  const seconds = (result.processingMs / 1_000).toFixed(1);

  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Analysis Results
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(totalReviews)} reviews · {result.themes.length} themes
            · {seconds}s
            {result.averageRating
              ? ` · ${result.averageRating.toFixed(1)}★ avg`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportMenu
            slug={slug}
            fileName={fileName}
            totalReviews={totalReviews}
            result={result}
          />
          {isOwner ? (
            <ShareSettingsDialog
              sessionId={sessionId}
              slug={slug}
              fileName={fileName}
              hasSharePassword={hasSharePassword}
              shareExpiresAt={shareExpiresAt}
            />
          ) : (
            <ShareButton />
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onNewAnalysis}
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            New analysis
          </Button>
        </div>
      </div>

      <Separator />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={BarChart3}
          label="Reviews analyzed"
          value={formatNumber(totalReviews)}
        />
        <StatCard
          icon={Hash}
          label="Themes found"
          value={String(result.themes.length)}
        />
        <StatCard
          icon={Clock}
          label="Processing time"
          value={`${seconds}s`}
        />
        {result.averageRating ? (
          <StatCard
            icon={Star}
            label="Average rating"
            value={`${result.averageRating.toFixed(1)} / 5`}
          />
        ) : (
          <StatCard
            icon={Star}
            label="Top sentiment"
            value={
              result.sentimentBreakdown.positive >=
              result.sentimentBreakdown.negative
                ? "Positive"
                : "Negative"
            }
          />
        )}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{result.executiveSummary}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Sentiment breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SentimentChart data={result.sentimentBreakdown} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Theme distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ThemeBarChart themes={result.themes} />
          </CardContent>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">
            Themes{" "}
            <span className="font-normal text-muted-foreground">
              · {visible.length} showing
            </span>
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {filterOptions.map(({ value, label, count }) => (
              <button
                key={value}
                onClick={() => setFilter(value)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  filter === value
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                )}
              >
                {label}{" "}
                <span
                  className={cn(
                    "tabular-nums",
                    filter === value ? "opacity-70" : "opacity-50"
                  )}
                >
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No themes in this category.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visible.map((theme) => (
              <ThemeCard key={theme.clusterId} theme={theme} />
            ))}
          </div>
        )}
      </section>
    </Shell>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden />
        {label}
      </div>
      <p className="truncate text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

type SentimentKey = ThemeAnalysis["sentiment"];

type ThemeStyle = {
  border: string;
  pct: string;
  bar: string;
  quote: string;
};

const THEME_STYLES: Record<SentimentKey, ThemeStyle> = {
  positive: {
    border: "border-l-emerald-500",
    pct: "text-emerald-600 dark:text-emerald-400",
    bar: "bg-emerald-500",
    quote: "border-emerald-200 dark:border-emerald-900",
  },
  negative: {
    border: "border-l-red-500",
    pct: "text-red-600 dark:text-red-400",
    bar: "bg-red-500",
    quote: "border-red-200 dark:border-red-900",
  },
  neutral: {
    border: "border-l-zinc-400",
    pct: "text-muted-foreground",
    bar: "bg-zinc-400",
    quote: "border-border",
  },
  mixed: {
    border: "border-l-amber-500",
    pct: "text-amber-600 dark:text-amber-400",
    bar: "bg-amber-500",
    quote: "border-amber-200 dark:border-amber-900",
  },
};

function ThemeCard({ theme }: { theme: ThemeAnalysis }) {
  const s = THEME_STYLES[theme.sentiment];

  return (
    <Card className={cn("flex flex-col border-l-4", s.border)}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-semibold leading-snug">
            {theme.label}
          </CardTitle>
          <span className={cn("shrink-0 text-sm font-bold tabular-nums", s.pct)}>
            {formatPercent(theme.percentage, 0)}
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          {theme.description}
        </p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full", s.bar)}
              style={{ width: `${Math.min(theme.percentage, 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {formatNumber(theme.reviewCount)}
          </span>
        </div>
        {theme.exampleQuotes.map((quote, i) => (
          <blockquote
            key={i}
            className={cn(
              "border-l-2 pl-3 text-xs italic leading-relaxed text-muted-foreground",
              s.quote
            )}
          >
            &ldquo;{truncate(quote, 160)}&rdquo;
          </blockquote>
        ))}
      </CardContent>
    </Card>
  );
}

function ProcessingScreen({
  totalReviews,
  elapsedSec,
  isSlow,
  onRetry,
}: {
  totalReviews?: number;
  elapsedSec: number;
  isSlow: boolean;
  onRetry: () => void;
}) {
  const estimate =
    totalReviews && totalReviews > 0
      ? formatEstimateRange(totalReviews)
      : "15–45s";

  const progress = Math.min(
    92,
    Math.round((elapsedSec / Math.max(parseInt(estimate.split("–")[1] ?? "45", 10), 1)) * 100)
  );

  return (
    <Shell>
      <div className="flex flex-col items-center justify-center gap-8 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted">
          <LoadingSpinner size="lg" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">
            Analyzing{" "}
            {totalReviews
              ? `${formatNumber(totalReviews)} reviews`
              : "your reviews"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Reading every review, clustering themes, writing summaries…
          </p>
        </div>
        <div className="w-full max-w-[300px] space-y-3">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs tabular-nums text-muted-foreground">
            {elapsedSec}s elapsed · usually {estimate}
          </p>
          {isSlow && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left dark:border-amber-900 dark:bg-amber-950/20">
              <p className="text-xs font-medium text-amber-800 dark:text-amber-300">
                Taking longer than usual
              </p>
              <p className="mt-1 text-xs text-amber-700/80 dark:text-amber-400/80">
                Large files or API load can slow things down. You can wait or
                retry.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 h-8 text-xs"
                onClick={onRetry}
              >
                <RefreshCw className="mr-1.5 h-3 w-3" />
                Retry analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    </Shell>
  );
}
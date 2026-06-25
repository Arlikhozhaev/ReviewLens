"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Plus,
  Check,
  GitCompareArrows,
  MessageSquare,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn, formatNumber } from "@/lib/utils";
import type {
  AnalysisComparison,
  ThemeDelta,
  ThemeMovement,
} from "@/lib/compare/diff";

export interface CompareOption {
  slug: string;
  label: string;
  createdAt: string;
  totalReviews: number;
}

interface CompareClientProps {
  options: CompareOption[];
  from: string | null;
  to: string | null;
  comparison: AnalysisComparison | null;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <Navbar />
      <main className="container relative max-w-4xl space-y-6 px-4 py-10">
        {children}
      </main>
    </div>
  );
}

export function CompareClient({
  options,
  from,
  to,
  comparison,
}: CompareClientProps) {
  const router = useRouter();

  function navigate(nextFrom: string | null, nextTo: string | null) {
    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    router.push(`/compare?${params.toString()}`);
  }

  const header = (
    <div className="space-y-1">
      <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
        <GitCompareArrows className="h-3 w-3" />
        Compare over time
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight">
        Compare <span className="text-gradient">analyses</span>
      </h1>
      <p className="text-sm text-muted-foreground">
        See how themes and sentiment shifted between two analyses.
      </p>
    </div>
  );

  if (options.length < 2) {
    return (
      <Shell>
        {header}
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            You need at least two completed analyses to compare.{" "}
            <Link href="/analyze" className="text-primary underline-offset-4 hover:underline">
              Run another analysis
            </Link>
            .
          </CardContent>
        </Card>
      </Shell>
    );
  }

  return (
    <Shell>
      {header}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
        <Selector
          label="Baseline (earlier)"
          value={from}
          exclude={to}
          options={options}
          onChange={(slug) => navigate(slug, to)}
        />
        <div className="hidden pb-2.5 text-muted-foreground sm:block">
          <ArrowRight className="h-5 w-5" />
        </div>
        <Selector
          label="Compared to (later)"
          value={to}
          exclude={from}
          options={options}
          onChange={(slug) => navigate(from, slug)}
        />
      </div>

      <Separator />

      {!comparison ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            Pick two analyses above to see the comparison.
          </CardContent>
        </Card>
      ) : (
        <ComparisonView comparison={comparison} />
      )}
    </Shell>
  );
}

function Selector({
  label,
  value,
  exclude,
  options,
  onChange,
}: {
  label: string;
  value: string | null;
  exclude: string | null;
  options: CompareOption[];
  onChange: (slug: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-card/60 px-3 text-sm shadow-sm backdrop-blur-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        <option value="" disabled>
          Select an analysis…
        </option>
        {options.map((o) => (
          <option key={o.slug} value={o.slug} disabled={o.slug === exclude}>
            {o.label} · {formatDate(o.createdAt)} · {o.totalReviews} reviews
          </option>
        ))}
      </select>
    </label>
  );
}

function ComparisonView({ comparison }: { comparison: AnalysisComparison }) {
  const { previous, current, themeDeltas } = comparison;

  const groups: { key: ThemeMovement; title: string }[] = [
    { key: "worsened", title: "Worsened" },
    { key: "new", title: "New themes" },
    { key: "improved", title: "Improved" },
    { key: "resolved", title: "Resolved" },
  ];

  return (
    <div className="space-y-6">
      {/* Headline */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-start gap-3 py-5">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-semibold">{comparison.headline}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {previous.label} ({formatDate(previous.createdAt)}) →{" "}
              {current.label} ({formatDate(current.createdAt)})
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Metric deltas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <MetricDelta
          icon={<MessageSquare className="h-3.5 w-3.5" />}
          label="Reviews"
          current={formatNumber(current.totalReviews)}
          delta={comparison.totalReviewsDelta}
          higherIsBetter
          unit=""
        />
        <MetricDelta
          icon={<Star className="h-3.5 w-3.5" />}
          label="Avg rating"
          current={
            current.averageRating ? current.averageRating.toFixed(1) : "—"
          }
          delta={
            comparison.averageRatingDelta !== null
              ? Number(comparison.averageRatingDelta.toFixed(1))
              : null
          }
          higherIsBetter
          unit=""
        />
        <MetricDelta
          icon={<TrendingDown className="h-3.5 w-3.5" />}
          label="Negative share"
          current={`${Math.round(
            comparison.sentimentDeltas.find((s) => s.key === "negative")
              ?.currentPct ?? 0
          )}%`}
          delta={Number(comparison.negativeShareDelta.toFixed(0))}
          higherIsBetter={false}
          unit=" pts"
        />
      </div>

      {/* Sentiment shift */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Sentiment shift</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5">
          {comparison.sentimentDeltas.map((s) => (
            <div key={s.key} className="flex items-center gap-3 text-sm">
              <span className="w-20 shrink-0 capitalize text-muted-foreground">
                {s.key}
              </span>
              <span className="tabular-nums text-muted-foreground">
                {Math.round(s.previousPct)}%
              </span>
              <ArrowRight className="h-3 w-3 text-muted-foreground" />
              <span className="tabular-nums font-medium">
                {Math.round(s.currentPct)}%
              </span>
              <span className="ml-auto">
                <DeltaPill
                  value={Number(s.deltaPct.toFixed(0))}
                  unit=" pts"
                  good={
                    s.key === "positive"
                      ? s.deltaPct >= 0
                      : s.key === "negative"
                        ? s.deltaPct <= 0
                        : undefined
                  }
                />
              </span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Theme movements */}
      <div className="space-y-5">
        {groups.map((group) => {
          const items = themeDeltas.filter((t) => t.movement === group.key);
          if (items.length === 0) return null;
          return (
            <section key={group.key}>
              <h2 className="mb-2 text-sm font-semibold">
                {group.title}{" "}
                <span className="font-normal text-muted-foreground">
                  · {items.length}
                </span>
              </h2>
              <div className="grid gap-2">
                {items.map((t) => (
                  <ThemeDeltaRow key={`${group.key}-${t.label}`} delta={t} />
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function MetricDelta({
  icon,
  label,
  current,
  delta,
  higherIsBetter,
  unit,
}: {
  icon: React.ReactNode;
  label: string;
  current: string;
  delta: number | null;
  higherIsBetter: boolean;
  unit: string;
}) {
  const good = delta === null || delta === 0 ? undefined : higherIsBetter ? delta > 0 : delta < 0;
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-2xl font-bold tabular-nums">{current}</p>
        {delta !== null && <DeltaPill value={delta} unit={unit} good={good} />}
      </div>
    </div>
  );
}

function DeltaPill({
  value,
  unit,
  good,
}: {
  value: number;
  unit: string;
  good?: boolean;
}) {
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
        <Minus className="h-3 w-3" /> 0{unit}
      </span>
    );
  }
  const color =
    good === undefined
      ? "bg-muted text-muted-foreground"
      : good
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        : "bg-red-500/10 text-red-600 dark:text-red-400";
  const Icon = value > 0 ? TrendingUp : TrendingDown;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums",
        color
      )}
    >
      <Icon className="h-3 w-3" />
      {value > 0 ? "+" : ""}
      {value}
      {unit}
    </span>
  );
}

const MOVEMENT_STYLE: Record<
  ThemeMovement,
  { border: string; icon: React.ReactNode }
> = {
  worsened: {
    border: "border-l-red-500",
    icon: <TrendingUp className="h-3.5 w-3.5 text-red-500" />,
  },
  improved: {
    border: "border-l-emerald-500",
    icon: <TrendingDown className="h-3.5 w-3.5 text-emerald-500" />,
  },
  new: {
    border: "border-l-amber-500",
    icon: <Plus className="h-3.5 w-3.5 text-amber-500" />,
  },
  resolved: {
    border: "border-l-zinc-400",
    icon: <Check className="h-3.5 w-3.5 text-zinc-500" />,
  },
  stable: {
    border: "border-l-zinc-300",
    icon: <Minus className="h-3.5 w-3.5 text-zinc-400" />,
  },
};

function ThemeDeltaRow({ delta }: { delta: ThemeDelta }) {
  const style = MOVEMENT_STYLE[delta.movement];
  const good =
    delta.sentiment === "positive"
      ? delta.deltaPercentage >= 0
      : delta.sentiment === "negative"
        ? delta.deltaPercentage <= 0
        : undefined;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border border-l-4 border-border bg-card px-3 py-2.5",
        style.border
      )}
    >
      {style.icon}
      <span className="min-w-0 flex-1 truncate text-sm font-medium">
        {delta.label}
      </span>
      <span className="hidden shrink-0 items-center gap-1.5 text-xs tabular-nums text-muted-foreground sm:flex">
        {delta.previousPercentage !== null
          ? `${Math.round(delta.previousPercentage)}%`
          : "—"}
        <ArrowRight className="h-3 w-3" />
        {delta.currentPercentage !== null
          ? `${Math.round(delta.currentPercentage)}%`
          : "—"}
      </span>
      <DeltaPill
        value={Number(delta.deltaPercentage.toFixed(0))}
        unit=" pts"
        good={good}
      />
    </div>
  );
}

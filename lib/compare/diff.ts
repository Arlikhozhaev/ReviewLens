import type { SentimentBreakdown, SentimentLabel } from "@/types";
import type { ThemeAnalysis } from "@/features/analysis/types";

export interface AnalysisSnapshot {
  slug: string;
  label: string;
  createdAt: string;
  totalReviews: number;
  averageRating?: number;
  sentimentBreakdown: SentimentBreakdown;
  themes: ThemeAnalysis[];
}

export type ThemeMovement =
  | "worsened"
  | "improved"
  | "new"
  | "resolved"
  | "stable";

export interface ThemeDelta {
  label: string;
  sentiment: SentimentLabel;
  movement: ThemeMovement;
  previousPercentage: number | null;
  currentPercentage: number | null;
  /** current − previous, in percentage points (share of reviews). */
  deltaPercentage: number;
  previousReviewCount: number | null;
  currentReviewCount: number | null;
}

export interface SentimentDelta {
  key: SentimentLabel;
  previousPct: number;
  currentPct: number;
  deltaPct: number;
}

export interface AnalysisComparison {
  previous: AnalysisSnapshot;
  current: AnalysisSnapshot;
  totalReviewsDelta: number;
  averageRatingDelta: number | null;
  /** Change in the share of negative sentiment, in percentage points. */
  negativeShareDelta: number;
  sentimentDeltas: SentimentDelta[];
  themeDeltas: ThemeDelta[];
  headline: string;
}

const SENTIMENT_KEYS: SentimentLabel[] = [
  "positive",
  "negative",
  "neutral",
  "mixed",
];

// Movements smaller than this (in percentage points) are treated as noise.
const STABLE_THRESHOLD_PP = 1;

export function normalizeLabel(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenSet(normalized: string): Set<string> {
  return new Set(normalized.split(" ").filter(Boolean));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

// Themes are generated independently per analysis, so labels rarely match
// exactly. Match on normalized equality, containment, or token overlap.
export function themesMatch(a: string, b: string): boolean {
  const na = normalizeLabel(a);
  const nb = normalizeLabel(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.length >= 4 && nb.length >= 4 && (na.includes(nb) || nb.includes(na))) {
    return true;
  }
  return jaccard(tokenSet(na), tokenSet(nb)) >= 0.5;
}

function sentimentPercentages(
  breakdown: SentimentBreakdown
): Record<SentimentLabel, number> {
  const total =
    breakdown.positive +
    breakdown.negative +
    breakdown.neutral +
    breakdown.mixed || 1;
  return {
    positive: (breakdown.positive / total) * 100,
    negative: (breakdown.negative / total) * 100,
    neutral: (breakdown.neutral / total) * 100,
    mixed: (breakdown.mixed / total) * 100,
  };
}

function classifyMovement(
  sentiment: SentimentLabel,
  deltaPp: number
): ThemeMovement {
  if (Math.abs(deltaPp) < STABLE_THRESHOLD_PP) return "stable";
  // Polarity only applies to clear praise/complaints. Neutral and mixed
  // themes change in prominence but we don't editorialize the direction.
  if (sentiment === "positive") return deltaPp > 0 ? "improved" : "worsened";
  if (sentiment === "negative") return deltaPp > 0 ? "worsened" : "improved";
  return "stable";
}

export function compareAnalyses(
  previous: AnalysisSnapshot,
  current: AnalysisSnapshot
): AnalysisComparison {
  const prevPct = sentimentPercentages(previous.sentimentBreakdown);
  const currPct = sentimentPercentages(current.sentimentBreakdown);

  const sentimentDeltas: SentimentDelta[] = SENTIMENT_KEYS.map((key) => ({
    key,
    previousPct: prevPct[key],
    currentPct: currPct[key],
    deltaPct: currPct[key] - prevPct[key],
  }));

  const themeDeltas: ThemeDelta[] = [];
  const matchedCurrentIdx = new Set<number>();

  // Previous themes → matched (movement) or resolved (gone).
  for (const prevTheme of previous.themes) {
    const idx = current.themes.findIndex(
      (c, i) => !matchedCurrentIdx.has(i) && themesMatch(prevTheme.label, c.label)
    );

    if (idx === -1) {
      themeDeltas.push({
        label: prevTheme.label,
        sentiment: prevTheme.sentiment,
        movement: "resolved",
        previousPercentage: prevTheme.percentage,
        currentPercentage: null,
        deltaPercentage: -prevTheme.percentage,
        previousReviewCount: prevTheme.reviewCount,
        currentReviewCount: null,
      });
      continue;
    }

    matchedCurrentIdx.add(idx);
    const currTheme = current.themes[idx]!;
    const deltaPp = currTheme.percentage - prevTheme.percentage;
    themeDeltas.push({
      label: currTheme.label,
      sentiment: currTheme.sentiment,
      movement: classifyMovement(currTheme.sentiment, deltaPp),
      previousPercentage: prevTheme.percentage,
      currentPercentage: currTheme.percentage,
      deltaPercentage: deltaPp,
      previousReviewCount: prevTheme.reviewCount,
      currentReviewCount: currTheme.reviewCount,
    });
  }

  // Current themes with no match → new.
  current.themes.forEach((currTheme, i) => {
    if (matchedCurrentIdx.has(i)) return;
    themeDeltas.push({
      label: currTheme.label,
      sentiment: currTheme.sentiment,
      movement: "new",
      previousPercentage: null,
      currentPercentage: currTheme.percentage,
      deltaPercentage: currTheme.percentage,
      previousReviewCount: null,
      currentReviewCount: currTheme.reviewCount,
    });
  });

  themeDeltas.sort(
    (a, b) => Math.abs(b.deltaPercentage) - Math.abs(a.deltaPercentage)
  );

  const negativeShareDelta = currPct.negative - prevPct.negative;
  const averageRatingDelta =
    current.averageRating !== undefined && previous.averageRating !== undefined
      ? current.averageRating - previous.averageRating
      : null;

  return {
    previous,
    current,
    totalReviewsDelta: current.totalReviews - previous.totalReviews,
    averageRatingDelta,
    negativeShareDelta,
    sentimentDeltas,
    themeDeltas,
    headline: buildHeadline(negativeShareDelta, themeDeltas),
  };
}

function buildHeadline(
  negativeShareDelta: number,
  themeDeltas: ThemeDelta[]
): string {
  const parts: string[] = [];

  if (negativeShareDelta >= STABLE_THRESHOLD_PP) {
    parts.push(`Negative sentiment up ${Math.round(negativeShareDelta)} pts`);
  } else if (negativeShareDelta <= -STABLE_THRESHOLD_PP) {
    parts.push(
      `Negative sentiment down ${Math.round(Math.abs(negativeShareDelta))} pts`
    );
  } else {
    parts.push("Sentiment held steady");
  }

  const topComplaint = themeDeltas.find(
    (t) =>
      t.sentiment === "negative" &&
      (t.movement === "worsened" || t.movement === "new")
  );

  if (topComplaint) {
    parts.push(
      topComplaint.movement === "new"
        ? `“${topComplaint.label}” is a new complaint`
        : `“${topComplaint.label}” complaints up ${Math.round(
            topComplaint.deltaPercentage
          )} pts`
    );
  }

  return parts.join(" · ");
}

import { describe, it, expect } from "vitest";
import {
  compareAnalyses,
  themesMatch,
  normalizeLabel,
  type AnalysisSnapshot,
} from "./diff";
import type { ThemeAnalysis } from "@/features/analysis/types";
import type { SentimentLabel } from "@/types";

function theme(
  label: string,
  sentiment: SentimentLabel,
  percentage: number,
  reviewCount: number
): ThemeAnalysis {
  return {
    clusterId: Math.floor(Math.random() * 1000),
    label,
    description: "",
    sentiment,
    reviewCount,
    percentage,
    exampleQuotes: [],
  };
}

function snapshot(over: Partial<AnalysisSnapshot>): AnalysisSnapshot {
  return {
    slug: "s",
    label: "Snapshot",
    createdAt: new Date().toISOString(),
    totalReviews: 100,
    averageRating: 4,
    sentimentBreakdown: { positive: 50, negative: 30, neutral: 15, mixed: 5 },
    themes: [],
    ...over,
  };
}

describe("normalizeLabel", () => {
  it("lowercases and strips punctuation", () => {
    expect(normalizeLabel("Battery Life!")).toBe("battery life");
  });
});

describe("themesMatch", () => {
  it("matches identical labels", () => {
    expect(themesMatch("Battery life", "battery life")).toBe(true);
  });

  it("matches via containment", () => {
    expect(themesMatch("Battery", "Battery life")).toBe(true);
  });

  it("matches via token overlap", () => {
    expect(themesMatch("Poor battery life", "Short battery life")).toBe(true);
  });

  it("does not match unrelated themes", () => {
    expect(themesMatch("Battery life", "Shipping speed")).toBe(false);
  });
});

describe("compareAnalyses", () => {
  it("flags a worsening negative theme with the correct delta", () => {
    const prev = snapshot({
      themes: [theme("Battery life", "negative", 10, 10)],
    });
    const curr = snapshot({
      themes: [theme("Battery life", "negative", 22, 22)],
    });

    const result = compareAnalyses(prev, curr);
    const battery = result.themeDeltas.find((t) =>
      t.label.includes("Battery")
    );
    expect(battery?.movement).toBe("worsened");
    expect(battery?.deltaPercentage).toBe(12);
  });

  it("marks unmatched current themes as new and missing ones as resolved", () => {
    const prev = snapshot({ themes: [theme("Shipping delays", "negative", 8, 8)] });
    const curr = snapshot({ themes: [theme("App crashes", "negative", 15, 15)] });

    const result = compareAnalyses(prev, curr);
    const movements = result.themeDeltas.map((t) => t.movement);
    expect(movements).toContain("new");
    expect(movements).toContain("resolved");
  });

  it("treats a positive theme gaining share as improved", () => {
    const prev = snapshot({ themes: [theme("Great support", "positive", 5, 5)] });
    const curr = snapshot({ themes: [theme("Great support", "positive", 18, 18)] });

    const result = compareAnalyses(prev, curr);
    expect(result.themeDeltas[0]?.movement).toBe("improved");
  });

  it("computes sentiment and review-count deltas", () => {
    const prev = snapshot({
      totalReviews: 80,
      sentimentBreakdown: { positive: 60, negative: 20, neutral: 0, mixed: 0 },
    });
    const curr = snapshot({
      totalReviews: 120,
      sentimentBreakdown: { positive: 40, negative: 60, neutral: 0, mixed: 0 },
    });

    const result = compareAnalyses(prev, curr);
    expect(result.totalReviewsDelta).toBe(40);
    // negative share 20/80=25% → 60/100=60% ⇒ +35pp
    expect(Math.round(result.negativeShareDelta)).toBe(35);
    expect(result.headline).toContain("Negative sentiment up");
  });

  it("reports a steady headline when nothing moves much", () => {
    const prev = snapshot({});
    const curr = snapshot({});
    const result = compareAnalyses(prev, curr);
    expect(result.headline).toContain("steady");
  });
});

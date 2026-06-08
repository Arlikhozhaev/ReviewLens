import { openai } from "@/lib/openai";
import { OPENAI_MODELS } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import type { SentimentBreakdown } from "@/types";
import type { ThemeAnalysis } from "../types";
import type { Cluster } from "../types";
import { getRepresentativeTexts } from "./clustering";

// ── Theme summarization ───────────────────────────────────────────────────────

export async function summarizeCluster(
  cluster: Cluster,
  totalReviews: number
): Promise<ThemeAnalysis> {
  const representatives = getRepresentativeTexts(cluster, 5);

  const reviewList = representatives
    .map((r, i) => `${i + 1}. "${r.slice(0, 400)}"`)
    .join("\n");

  const prompt = `You are analyzing ${cluster.texts.length} similar customer reviews for a product.

Here are the most representative reviews from this group:
${reviewList}

Respond ONLY with a JSON object — no preamble, no markdown:
{
  "label": "2-5 word theme name that captures what these reviews share",
  "description": "One sentence describing what customers in this group are saying",
  "sentiment": "positive" | "negative" | "neutral" | "mixed"
}

Choose sentiment based on whether these reviews are primarily positive, negative, neutral, or a mix.`;

  let attempt = 0;
  while (attempt < 3) {
    try {
      const response = await openai.chat.completions.create({
        model: OPENAI_MODELS.SUMMARIZATION,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 150,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content ?? "{}";

      let parsed: {
        label?: string;
        description?: string;
        sentiment?: ThemeAnalysis["sentiment"];
      };

      try {
        parsed = JSON.parse(content) as typeof parsed;
      } catch {
        parsed = {};
      }

      const percentage = (cluster.texts.length / totalReviews) * 100;

      return {
        clusterId: cluster.id,
        label: parsed.label ?? `Theme ${cluster.id + 1}`,
        description: parsed.description ?? "Customer feedback group",
        sentiment: parsed.sentiment ?? "neutral",
        reviewCount: cluster.texts.length,
        percentage,
        exampleQuotes: representatives.slice(0, 3),
      };
    } catch (error: unknown) {
      attempt++;
      if (attempt >= 3) {
        // Fallback: return a generic theme instead of crashing the pipeline
        console.error(`[summarization] Cluster ${cluster.id} failed:`, error);
        return {
          clusterId: cluster.id,
          label: `Theme ${cluster.id + 1}`,
          description: "A group of similar customer reviews",
          sentiment: "neutral",
          reviewCount: cluster.texts.length,
          percentage: (cluster.texts.length / totalReviews) * 100,
          exampleQuotes: representatives.slice(0, 3),
        };
      }
      await sleep(1_000 * attempt);
    }
  }

  // TypeScript requires a return here — unreachable in practice
  throw new Error(`summarizeCluster exhausted retries for cluster ${cluster.id}`);
}

// ── Executive summary ─────────────────────────────────────────────────────────

export async function generateExecutiveSummary(
  themes: ThemeAnalysis[],
  totalReviews: number,
  averageRating?: number
): Promise<string> {
  const sorted = [...themes].sort((a, b) => b.reviewCount - a.reviewCount);

  const themeList = sorted
    .map(
      (t) =>
        `- ${t.label} (${t.reviewCount} reviews, ${t.sentiment}): ${t.description}`
    )
    .join("\n");

  const ratingLine = averageRating
    ? `Average rating: ${averageRating.toFixed(1)}/5 stars.\n`
    : "";

  const prompt = `You are a product analyst. Write a 2-3 sentence executive summary of ${totalReviews} customer reviews.

${ratingLine}Key themes found:
${themeList}

Be specific and actionable. Highlight the most important positive and negative signals.
Write for a product manager who will use this to make decisions.`;

  try {
    const response = await openai.chat.completions.create({
      model: OPENAI_MODELS.SUMMARIZATION,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
      max_tokens: 200,
    });

    return (
      response.choices[0]?.message?.content?.trim() ??
      "Analysis complete. See themes below for details."
    );
  } catch (error) {
    console.error("[summarization] Executive summary failed:", error);
    return "Analysis complete. See themes below for detailed insights.";
  }
}

// ── Sentiment breakdown ───────────────────────────────────────────────────────

export function computeSentimentBreakdown(
  themes: ThemeAnalysis[]
): SentimentBreakdown {
  const total = themes.reduce((sum, t) => sum + t.reviewCount, 0);

  if (total === 0) return { positive: 0, negative: 0, neutral: 0, mixed: 0 };

  const raw = { positive: 0, negative: 0, neutral: 0, mixed: 0 };
  for (const theme of themes) {
    raw[theme.sentiment] += theme.reviewCount;
  }

  return {
    positive: Math.round((raw.positive / total) * 100),
    negative: Math.round((raw.negative / total) * 100),
    neutral: Math.round((raw.neutral / total) * 100),
    mixed: Math.round((raw.mixed / total) * 100),
  };
}
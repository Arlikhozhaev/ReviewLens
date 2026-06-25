import {
  ESTIMATED_MS_PER_REVIEW,
  ESTIMATED_SUMMARIZATION_BASE_MS,
  NUM_CLUSTERS,
} from "@/lib/constants";

/** Rough client-side estimate for processing screen copy — not a guarantee. */
export function estimatePipelineMs(reviewCount: number): number {
  const k = Math.min(
    NUM_CLUSTERS.MAX,
    Math.max(NUM_CLUSTERS.MIN, Math.round(reviewCount / 15))
  );
  const embeddingMs = reviewCount * ESTIMATED_MS_PER_REVIEW;
  const summarizationMs = ESTIMATED_SUMMARIZATION_BASE_MS + k * 2_500;
  return embeddingMs + summarizationMs + 2_000;
}

export function formatEstimateRange(reviewCount: number): string {
  const mid = estimatePipelineMs(reviewCount);
  const low = Math.max(8, Math.round(mid * 0.6 / 1_000));
  const high = Math.round(mid * 1.4 / 1_000);
  return `${low}–${high}s`;
}

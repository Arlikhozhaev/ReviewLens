export const APP_NAME = "ReviewLens" as const;
export const APP_TAGLINE = "Turn reviews into product insights" as const;
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

/** Bundled demo CSV for recruiters and first-time users. */
export const SAMPLE_REVIEWS_CSV_PATH = "/samples/product-reviews.csv";
export const SAMPLE_REVIEWS_FILENAME = "product-reviews-sample.csv";

// ── CSV Upload ────────────────────────────────────────────────────────────────

export const MAX_CSV_FILE_SIZE_MB = 10;
export const MAX_CSV_FILE_SIZE_BYTES = MAX_CSV_FILE_SIZE_MB * 1_024 * 1_024;
export const MAX_REVIEWS_PER_ANALYSIS = 500;
export const MIN_REVIEWS_FOR_CLUSTERING = 5;

// Character limit for individual review text.
// Amazon reviews can be very long — 8000 chars covers 99%+ of real reviews.
// The AI pipeline will work with the full text; we truncate only the extreme outliers.
export const MAX_REVIEW_TEXT_LENGTH = 8_000;
export const MAX_REVIEW_TOKENS = 512;

export const ACCEPTED_CSV_MIME_TYPES = [
  "text/csv",
  "application/csv",
  "application/vnd.ms-excel",
  "text/plain", // Some OS/browsers send .csv as text/plain
] as const;

export type CsvMimeType = (typeof ACCEPTED_CSV_MIME_TYPES)[number];

// ── AI ────────────────────────────────────────────────────────────────────────

export const OPENAI_MODELS = {
  // 1536-dim embeddings, cheap, fast — perfect for clustering
  EMBEDDING: "text-embedding-3-small",
  // GPT-4o-mini: near-GPT4 quality at 1/10th the cost for summarization
  SUMMARIZATION: "gpt-4o-mini",
} as const;

export const EMBEDDING_BATCH_SIZE = 100; // OpenAI allows up to 2048 inputs/request

// ── Analysis ──────────────────────────────────────────────────────────────────

export const ANALYSIS_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export const SENTIMENT_LABELS = {
  POSITIVE: "positive",
  NEGATIVE: "negative",
  NEUTRAL: "neutral",
  MIXED: "mixed",
} as const;

export const NUM_CLUSTERS = {
  MIN: 2,
  MAX: 8,
  DEFAULT: 5, // K for k-means — tuned empirically for 50–200 reviews
} as const;

// ── Pipeline timing (used for UX estimates + recovery) ───────────────────────

/** If PROCESSING exceeds this, allow a new pipeline claim. */
export const PIPELINE_STALE_MS = 10 * 60 * 1_000;

/** Dashboard shows a "taking longer" message after this. */
export const PIPELINE_UI_TIMEOUT_MS = 90 * 1_000;

/** Client poll interval while waiting for results. */
export const STATUS_POLL_INTERVAL_MS = 2_000;

/** Rough per-review embedding time for UX copy (not a SLA). */
export const ESTIMATED_MS_PER_REVIEW = 35;

/** Base LLM summarization overhead regardless of review count. */
export const ESTIMATED_SUMMARIZATION_BASE_MS = 8_000;

// ── Rate limits ─────────────────────────────────────────────────────────────

export const RATE_LIMITS = {
  CREATE_ANALYSIS: { limit: 20, windowMs: 60 * 60 * 1_000 },
  START_PIPELINE: { limit: 30, windowMs: 60 * 60 * 1_000 },
} as const;

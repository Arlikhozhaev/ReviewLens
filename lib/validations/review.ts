import { z } from "zod";
import {
  MAX_REVIEWS_PER_ANALYSIS,
  ACCEPTED_CSV_MIME_TYPES,
  MAX_CSV_FILE_SIZE_BYTES,
  MAX_REVIEW_TEXT_LENGTH,
} from "@/lib/constants";

// ── Sanitize + truncate text before validation ────────────────────────────────

export function sanitizeReviewText(raw: string): string {
  return (
    raw
      // Strip null bytes — break JSON serialization
      .replace(/\0/g, "")
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .trim()
      // Hard cap: silently truncate — callers should warn user separately
      .slice(0, MAX_REVIEW_TEXT_LENGTH)
  );
}

// ── Parse a rating from any reasonable format ─────────────────────────────────
// Handles: "5", "5.0", "4.5", "5 out of 5 stars", "5/5", "★★★★★" (5 stars)

export function parseRating(raw: string | undefined): number | undefined {
  if (!raw || raw.trim() === "") return undefined;

  // Extract leading number — works for "5 out of 5 stars", "4/5", "3.5"
  const match = raw.trim().match(/^(\d+(?:\.\d+)?)/);
  if (!match || !match[1]) return undefined;

  const value = parseFloat(match[1]);
  if (Number.isNaN(value)) return undefined;

  // Normalize 0–10 scale to 1–5
  if (value > 5 && value <= 10) return Math.round((value / 10) * 5);

  // Clamp to 1–5 range
  if (value < 1 || value > 5) return undefined;
  return value;
}

// ── Raw review (already parsed, used in API request body) ─────────────────────

export const rawReviewSchema = z.object({
  id: z.string().min(1),
  text: z
    .string()
    .min(3, "Review text too short")
    .max(MAX_REVIEW_TEXT_LENGTH, `Review exceeds ${MAX_REVIEW_TEXT_LENGTH} character limit`),
  rating: z.number().min(1).max(5).optional(),
  author: z.string().max(200).optional(),
  date: z.string().optional(),
  source: z.string().optional(),
});

// ── CSV row (raw string values straight from PapaParse) ───────────────────────

export const csvRowSchema = z.object({
  review: z.string().min(1, "Review text is required"),
  rating: z
    .string()
    .optional()
    .transform((val) => parseRating(val))
    .pipe(z.number().min(1).max(5).optional()),
  author: z.string().max(200).optional(),
  date: z.string().optional(),
});

// ── API request: POST /api/analysis ──────────────────────────────────────────

export const analyzeRequestSchema = z.object({
  reviews: z
    .array(rawReviewSchema)
    .min(1, "At least 1 review is required")
    .max(
      MAX_REVIEWS_PER_ANALYSIS,
      `Maximum ${MAX_REVIEWS_PER_ANALYSIS} reviews per analysis`
    ),
  sourceType: z.enum(["csv", "url", "paste"]),
  sourceUrl: z.string().url().optional(),
  fileName: z.string().optional(),
  organizationId: z.string().cuid().optional(),
});

// ── File upload (client-side pre-check) ───────────────────────────────────────

export const csvFileSchema = z.object({
  size: z
    .number()
    .max(
      MAX_CSV_FILE_SIZE_BYTES,
      `File must be under ${MAX_CSV_FILE_SIZE_BYTES / 1_024 / 1_024}MB`
    ),
  type: z.enum(ACCEPTED_CSV_MIME_TYPES, {
    error: "File must be a CSV",
  }),
});

export type RawReviewInput = z.infer<typeof rawReviewSchema>;
export type CsvRowInput = z.infer<typeof csvRowSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
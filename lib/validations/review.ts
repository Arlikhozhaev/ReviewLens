import { z } from "zod";
import {
  MAX_REVIEWS_PER_ANALYSIS,
  ACCEPTED_CSV_MIME_TYPES,
  MAX_CSV_FILE_SIZE_BYTES,
} from "@/lib/constants";
import type { CsvMimeType } from "@/lib/constants";

// ── Raw review shape coming from CSV parse or URL scrape ──────────────────────

export const rawReviewSchema = z.object({
  id: z.string().min(1),
  text: z
    .string()
    .min(10, "Review must be at least 10 characters")
    .max(5_000, "Review exceeds 5000 character limit"),
  rating: z.number().min(1).max(5).optional(),
  author: z.string().max(100).optional(),
  date: z.string().optional(),
  source: z.string().optional(),
});

// ── CSV row schema
// PapaParse gives us string values — we coerce numbers here.
export const csvRowSchema = z.object({
  // Accept common column names (case-insensitive matching happens before this)
  review: z.string().min(1, "Review text is required"),
  rating: z
    .string()
    .optional()
    .transform((val) => {
      if (!val || val.trim() === "") return undefined;
      const parsed = parseFloat(val);
      return Number.isNaN(parsed) ? undefined : parsed;
    })
    .pipe(z.number().min(1).max(5).optional()),
  author: z.string().max(100).optional(),
  date: z.string().optional(),
});

// ── API request: submit reviews for analysis ──────────────────────────────────

export const analyzeRequestSchema = z.object({
  reviews: z
    .array(rawReviewSchema)
    .min(1, "At least 1 review is required")
    .max(
      MAX_REVIEWS_PER_ANALYSIS,
      `Maximum ${MAX_REVIEWS_PER_ANALYSIS} reviews per analysis`
    ),
  sourceType: z.enum(["csv", "url"]),
  sourceUrl: z.string().url().optional(),
  fileName: z.string().optional(),
});

// ── API request: analyze by URL ───────────────────────────────────────────────

export const urlAnalysisSchema = z.object({
  url: z.string().url("Must be a valid product URL"),
});

// ── File upload validation (client-side, before parsing) ──────────────────────

export const csvFileSchema = z.object({
  size: z
    .number()
    .max(
      MAX_CSV_FILE_SIZE_BYTES,
      `File must be under ${MAX_CSV_FILE_SIZE_BYTES / 1_024 / 1_024}MB`
    ),
  type: z.string().refine(
  (val): val is CsvMimeType => (ACCEPTED_CSV_MIME_TYPES as readonly string[]).includes(val),
    {
        message: "Invalid file type",
    }
    ),
});

// ── Exported inferred types ───────────────────────────────────────────────────

export type RawReviewInput = z.infer<typeof rawReviewSchema>;
export type CsvRowInput = z.infer<typeof csvRowSchema>;
export type AnalyzeRequest = z.infer<typeof analyzeRequestSchema>;
// ─────────────────────────────────────────────────────────────────────────────
// Reviews
// ─────────────────────────────────────────────────────────────────────────────

export interface RawReview {
  id: string;
  text: string;
  rating?: number;
  author?: string;
  date?: string;
  source?: string;
}

export interface ProcessedReview extends RawReview {
  sentiment: SentimentLabel;
  embedding?: number[];
  clusterId?: number;
}

export type SentimentLabel = "positive" | "negative" | "neutral" | "mixed";

// ─────────────────────────────────────────────────────────────────────────────
// Analysis
// ─────────────────────────────────────────────────────────────────────────────

export interface ReviewTheme {
  id: string;
  label: string;
  description: string;
  sentiment: SentimentLabel;
  reviewCount: number;
  percentage: number;
  exampleQuotes: string[];
}

export interface SentimentBreakdown {
  positive: number;
  negative: number;
  neutral: number;
  mixed: number;
}

export interface AnalysisResult {
  id: string;
  sessionId: string;
  totalReviews: number;
  processedAt: Date;
  executiveSummary: string;
  sentimentBreakdown: SentimentBreakdown;
  topComplaints: ReviewTheme[];
  topPraises: ReviewTheme[];
  averageRating?: number;
  shareableSlug: string;
}

export type AnalysisStatus = "pending" | "processing" | "completed" | "failed";
export type AnalysisSourceType = "csv" | "url";

// ─────────────────────────────────────────────────────────────────────────────
// CSV Upload
// ─────────────────────────────────────────────────────────────────────────────

export interface CsvUploadResult {
  reviews: RawReview[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: CsvParseError[];
}

export interface CsvParseError {
  row: number;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// API Response envelope
//
// Every route handler returns one of these two shapes.
// Discriminated union means TypeScript forces you to check success
// before accessing data — no accidental undefined.data access.
// ─────────────────────────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
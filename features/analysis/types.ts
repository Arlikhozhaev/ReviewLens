import type { SentimentLabel, SentimentBreakdown } from "@/types";

// ── Intermediate pipeline data ────────────────────────────────────────────────

export interface EmbeddedReview {
  id: string;         // matches Review.id in database
  text: string;
  embedding: number[];
}

export interface Cluster {
  id: number;
  reviewIds: string[];
  embeddings: number[][];
  texts: string[];
  centroid: number[];
}

// ── Pipeline output ───────────────────────────────────────────────────────────

export interface ThemeAnalysis {
  clusterId: number;
  label: string;
  description: string;
  sentiment: SentimentLabel;
  reviewCount: number;
  percentage: number;
  exampleQuotes: string[];
}

export interface PipelineResult {
  themes: ThemeAnalysis[];
  executiveSummary: string;
  sentimentBreakdown: SentimentBreakdown;
  averageRating?: number;
  processingMs: number;
}

/**
 * The fully computed result stored in AnalysisResult.
 * Single source of truth used by: status route, dashboard page, dashboard client.
 */
export interface StoredAnalysisResult {
  executiveSummary: string;
  sentimentBreakdown: SentimentBreakdown;
  themes: ThemeAnalysis[];
  averageRating?: number;
  processingMs: number;
}
import type { RawReview, CsvParseError } from "@/types";

export interface DetectedColumns {
  reviewColumn: string;
  ratingColumn?: string;
  authorColumn?: string;
  dateColumn?: string;
}

export interface CsvParseResult {
  reviews: RawReview[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: CsvParseError[];
  detectedColumns: DetectedColumns;
  allColumns: string[];
}

export type UploadStep = "upload" | "preview" | "submitting";
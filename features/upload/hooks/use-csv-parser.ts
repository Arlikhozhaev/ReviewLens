"use client";

import { useState, useCallback } from "react";
import Papa from "papaparse";
import {
  csvRowSchema,
  sanitizeReviewText,
  parseRating,
} from "@/lib/validations/review";
import {
  MAX_CSV_FILE_SIZE_BYTES,
  MAX_REVIEWS_PER_ANALYSIS,
  MAX_REVIEW_TEXT_LENGTH,
} from "@/lib/constants";
import type { RawReview, CsvParseError } from "@/types";
import type { CsvParseResult } from "../types";
import { detectColumns } from "../utils/column-detection";

interface UseCsvParserReturn {
  parse: (file: File) => void;
  result: CsvParseResult | null;
  isParsing: boolean;
  error: string | null;
  reset: () => void;
}

export function useCsvParser(): UseCsvParserReturn {
  const [isParsing, setIsParsing] = useState(false);
  const [result, setResult] = useState<CsvParseResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsParsing(false);
    setResult(null);
    setError(null);
  }, []);

  const parse = useCallback((file: File) => {
    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      setError(
        `File too large. Maximum size is ${MAX_CSV_FILE_SIZE_BYTES / 1_024 / 1_024}MB.`
      );
      return;
    }

    setIsParsing(true);
    setError(null);
    setResult(null);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      // Normalize headers: "Review Body" → "review_body", "Star Rating" → "star_rating"
      transformHeader: (h) =>
        h
          .toLowerCase()
          .trim()
          .replace(/[\s\-/]+/g, "_")
          .replace(/[^a-z0-9_]/g, ""),

      complete: (results) => {
        try {
          const allColumns = results.meta.fields ?? [];

          if (allColumns.length === 0) {
            setError(
              "CSV has no header row. Add a header row with at least a 'review' column."
            );
            setIsParsing(false);
            return;
          }

          const detected = detectColumns(allColumns);

          if (!detected) {
            setError(
              `No review column detected. Your columns: ${allColumns.join(", ")}. ` +
                `Rename the review text column to "review", "review_body", "text", "comment", or "feedback".`
            );
            setIsParsing(false);
            return;
          }

          const reviews: RawReview[] = [];
          const parseErrors: CsvParseError[] = [];
          let truncatedCount = 0;

          for (let index = 0; index < results.data.length; index++) {
            const row = results.data[index];
            if (!row) continue;

            const rowNumber = index + 2; // +2: 1-indexed + header offset

            const rawText = row[detected.reviewColumn] ?? "";

            // Sanitize before schema validation
            const cleanText = sanitizeReviewText(rawText);

            if (cleanText.length === 0) {
              parseErrors.push({ row: rowNumber, message: "Empty review text" });
              continue;
            }

            // Track truncations so we can warn the user
            if (rawText.length > MAX_REVIEW_TEXT_LENGTH) {
              truncatedCount++;
            }

            // Parse rating using the flexible parser (handles "5 out of 5 stars" etc.)
            const rawRating = detected.ratingColumn
              ? row[detected.ratingColumn]
              : undefined;
            const parsedRating = parseRating(rawRating);

            // Minimal schema validation — heavy validation happens server-side
            const validation = csvRowSchema.safeParse({
              review: cleanText,
              // Pass undefined so csvRowSchema doesn't try to parse it again
              author: detected.authorColumn
                ? row[detected.authorColumn]
                : undefined,
              date: detected.dateColumn ? row[detected.dateColumn] : undefined,
            });

            if (!validation.success) {
              parseErrors.push({
                row: rowNumber,
                message: validation.error.issues.map((i) => i.message).join("; "),
              });
              continue;
            }

            reviews.push({
              id: crypto.randomUUID(),
              text: cleanText,
              rating: parsedRating,
              author: validation.data.author ?? undefined,
              date: validation.data.date ?? undefined,
              source: "csv",
            });
          }

          // Enforce hard cap
          const cappedReviews = reviews.slice(0, MAX_REVIEWS_PER_ANALYSIS);
          const droppedCount = reviews.length - cappedReviews.length;

          if (droppedCount > 0) {
            parseErrors.push({
              row: -1,
              message: `${droppedCount} reviews dropped — exceeded the ${MAX_REVIEWS_PER_ANALYSIS} review limit.`,
            });
          }

          if (truncatedCount > 0) {
            parseErrors.push({
              row: -1,
              message: `${truncatedCount} review${truncatedCount > 1 ? "s" : ""} truncated to ${MAX_REVIEW_TEXT_LENGTH.toLocaleString()} characters.`,
            });
          }

          setResult({
            reviews: cappedReviews,
            totalRows: results.data.length,
            validRows: cappedReviews.length,
            invalidRows: parseErrors.filter((e) => e.row > 0).length,
            errors: parseErrors,
            detectedColumns: detected,
            allColumns,
          });
        } catch (err) {
          setError("Failed to process CSV. Check the file format and try again.");
          console.error("[useCsvParser]", err);
        } finally {
          setIsParsing(false);
        }
      },
      error: (err) => {
        setError(`Could not read file: ${err.message}`);
        setIsParsing(false);
      },
    });
  }, []);

  return { parse, result, isParsing, error, reset };
}
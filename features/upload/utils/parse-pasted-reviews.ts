import Papa from "papaparse";
import {
  csvRowSchema,
  parseRating,
  sanitizeReviewText,
} from "@/lib/validations/review";
import {
  MAX_REVIEWS_PER_ANALYSIS,
  MAX_REVIEW_TEXT_LENGTH,
} from "@/lib/constants";
import type { CsvParseError, RawReview } from "@/types";
import type { CsvParseResult } from "../types";
import { detectColumns } from "./column-detection";

const RATING_PREFIX =
  /^(?:\(?(\d(?:\.\d)?)\s*(?:\/\s*5|out of 5|stars?)\)?|\[(\d(?:\.\d)?)\s*stars?\]|rating[:\s]+(\d(?:\.\d)?))\s*[-–—:]\s*/i;

const NUMBERED_LINE = /^\s*(?:\d+[\.)]|[-•*])\s+/;

function newId(): string {
  return crypto.randomUUID();
}

function looksLikeCsv(text: string): boolean {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  if (!firstLine.includes(",") && !firstLine.includes("\t")) return false;
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const headers = firstLine.split(delimiter).map((h) => h.trim().replace(/^"|"$/g, ""));
  return detectColumns(headers) !== null;
}

function parseCsvPaste(text: string): CsvParseResult | null {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) =>
      h
        .toLowerCase()
        .trim()
        .replace(/[\s\-/]+/g, "_")
        .replace(/[^a-z0-9_]/g, ""),
  });

  const allColumns = parsed.meta.fields ?? [];
  const detected = detectColumns(allColumns);
  if (!detected) return null;

  const reviews: RawReview[] = [];
  const errors: CsvParseError[] = [];
  let truncatedCount = 0;

  for (let index = 0; index < parsed.data.length; index++) {
    const row = parsed.data[index];
    if (!row) continue;
    const rowNumber = index + 2;
    const rawText = row[detected.reviewColumn] ?? "";
    const cleanText = sanitizeReviewText(rawText);

    if (!cleanText) {
      errors.push({ row: rowNumber, message: "Empty review text" });
      continue;
    }
    if (rawText.length > MAX_REVIEW_TEXT_LENGTH) truncatedCount++;

    const validation = csvRowSchema.safeParse({
      review: cleanText,
      rating: detected.ratingColumn ? row[detected.ratingColumn] : undefined,
      author: detected.authorColumn ? row[detected.authorColumn] : undefined,
      date: detected.dateColumn ? row[detected.dateColumn] : undefined,
    });

    if (!validation.success) {
      errors.push({
        row: rowNumber,
        message: validation.error.issues.map((i) => i.message).join("; "),
      });
      continue;
    }

    reviews.push({
      id: newId(),
      text: cleanText,
      rating: parseRating(detected.ratingColumn ? row[detected.ratingColumn] : undefined),
      author: validation.data.author ?? undefined,
      date: validation.data.date ?? undefined,
      source: "paste",
    });
  }

  return finalizeResult(reviews, errors, parsed.data.length, detected, allColumns, truncatedCount);
}

function parseInlineRating(text: string): { text: string; rating?: number } {
  const match = text.match(RATING_PREFIX);
  if (!match) return { text };
  const ratingRaw = match[1] ?? match[2] ?? match[3];
  const rating = parseRating(ratingRaw);
  return { text: sanitizeReviewText(text.slice(match[0].length)), rating };
}

function parsePlainBlocks(text: string): CsvParseResult {
  const blocks = text
    .split(/\n\s*\n+/)
    .map((b) => b.trim())
    .filter(Boolean);

  const reviews: RawReview[] = [];
  const errors: CsvParseError[] = [];
  let truncatedCount = 0;

  blocks.forEach((block, index) => {
    const lines = block
      .split(/\n/)
      .map((l) => l.replace(NUMBERED_LINE, "").trim())
      .filter(Boolean);
    const joined = sanitizeReviewText(lines.join(" "));
    if (joined.length < 3) {
      errors.push({ row: index + 1, message: "Review text too short" });
      return;
    }
    if (block.length > MAX_REVIEW_TEXT_LENGTH) truncatedCount++;
    const { text: body, rating } = parseInlineRating(joined);
    if (body.length < 3) {
      errors.push({ row: index + 1, message: "Review text too short after parsing" });
      return;
    }
    reviews.push({
      id: newId(),
      text: body,
      rating,
      source: "paste",
    });
  });

  return finalizeResult(
    reviews,
    errors,
    blocks.length,
    { reviewColumn: "text" },
    ["text"],
    truncatedCount
  );
}

function parseLineMode(text: string): CsvParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(NUMBERED_LINE, "").trim())
    .filter(Boolean);

  const reviews: RawReview[] = [];
  const errors: CsvParseError[] = [];
  let truncatedCount = 0;

  lines.forEach((line, index) => {
    const { text: body, rating } = parseInlineRating(line);
    const clean = sanitizeReviewText(body);
    if (clean.length < 3) {
      errors.push({ row: index + 1, message: "Review text too short" });
      return;
    }
    if (line.length > MAX_REVIEW_TEXT_LENGTH) truncatedCount++;
    reviews.push({
      id: newId(),
      text: clean,
      rating,
      source: "paste",
    });
  });

  return finalizeResult(
    reviews,
    errors,
    lines.length,
    { reviewColumn: "text" },
    ["text"],
    truncatedCount
  );
}

function finalizeResult(
  reviews: RawReview[],
  errors: CsvParseError[],
  totalRows: number,
  detectedColumns: CsvParseResult["detectedColumns"],
  allColumns: string[],
  truncatedCount: number
): CsvParseResult {
  if (truncatedCount > 0) {
    errors.push({
      row: -1,
      message: `${truncatedCount} review${truncatedCount > 1 ? "s" : ""} truncated to ${MAX_REVIEW_TEXT_LENGTH.toLocaleString()} characters.`,
    });
  }

  const capped = reviews.slice(0, MAX_REVIEWS_PER_ANALYSIS);
  const dropped = reviews.length - capped.length;
  if (dropped > 0) {
    errors.push({
      row: -1,
      message: `${dropped} reviews dropped — exceeded the ${MAX_REVIEWS_PER_ANALYSIS} review limit.`,
    });
  }

  return {
    reviews: capped,
    totalRows,
    validRows: capped.length,
    invalidRows: errors.filter((e) => e.row > 0).length,
    errors,
    detectedColumns,
    allColumns,
  };
}

/** Parse pasted review text (CSV blob, paragraphs, or one-per-line). */
export function parsePastedReviews(raw: string): CsvParseResult {
  const text = raw.trim();
  if (!text) {
    return {
      reviews: [],
      totalRows: 0,
      validRows: 0,
      invalidRows: 0,
      errors: [{ row: -1, message: "Paste at least one review." }],
      detectedColumns: { reviewColumn: "text" },
      allColumns: ["text"],
    };
  }

  if (looksLikeCsv(text)) {
    const csvResult = parseCsvPaste(text);
    if (csvResult && csvResult.validRows > 0) return csvResult;
  }

  if (text.includes("\n\n")) {
    return parsePlainBlocks(text);
  }

  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  const avgLen =
    lines.reduce((sum, l) => sum + l.length, 0) / Math.max(lines.length, 1);

  // Short lines are usually a list of reviews; long single block is one review.
  if (lines.length > 1 && avgLen >= 20) {
    return parseLineMode(text);
  }

  return parsePlainBlocks(text);
}

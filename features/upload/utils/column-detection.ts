import type { DetectedColumns } from "../types";

const REVIEW_ALIASES = [
  "review", "review_text", "review_body", "reviewtext",
  "text", "body", "content", "comment", "comments",
  "feedback", "message", "description", "opinion",
];

const RATING_ALIASES = [
  "rating", "ratings", "stars", "star", "score",
  "rate", "star_rating", "overall", "overall_rating",
];

const AUTHOR_ALIASES = [
  "author", "reviewer", "name", "username", "user",
  "customer", "customer_name", "reviewer_name",
];

const DATE_ALIASES = [
  "date", "created_at", "createdat", "timestamp",
  "time", "posted", "posted_at", "review_date",
];

function matchColumn(
  headers: string[],
  aliases: string[]
): string | undefined {
  // Exact match first — most reliable
  for (const alias of aliases) {
    const found = headers.find((h) => h === alias);
    if (found) return found;
  }
  // Substring match — handles "product_review_text" etc.
  for (const alias of aliases) {
    const found = headers.find(
      (h) => h.includes(alias) || alias.includes(h)
    );
    if (found) return found;
  }
  return undefined;
}

export function detectColumns(normalizedHeaders: string[]): DetectedColumns | null {
  const reviewColumn = matchColumn(normalizedHeaders, REVIEW_ALIASES);

  // Review column is mandatory — without it we can't proceed
  if (!reviewColumn) return null;

  return {
    reviewColumn,
    ratingColumn: matchColumn(normalizedHeaders, RATING_ALIASES),
    authorColumn: matchColumn(normalizedHeaders, AUTHOR_ALIASES),
    dateColumn: matchColumn(normalizedHeaders, DATE_ALIASES),
  };
}
import type { DetectedColumns } from "../types";

const REVIEW_ALIASES = [
  "review",
  "review_text",
  "review_body",
  "reviewtext",
  "text",
  "body",
  "content",
  "comment",
  "comments",
  "feedback",
  "message",
  "description",
  "opinion",
  "tweet",
  "tweet_text",
  "post",
  "post_text",
  "caption",
];

const RATING_ALIASES = [
  "rating",
  "ratings",
  "stars",
  "star",
  "score",
  "rate",
  "star_rating",
  "overall",
  "overall_rating",
];

const AUTHOR_ALIASES = [
  "author",
  "reviewer",
  "name",
  "username",
  "user",
  "customer",
  "customer_name",
  "reviewer_name",
  "user_name",
  "screen_name",
  "handle",
  "x_handle",
];

const DATE_ALIASES = [
  "date",
  "created_at",
  "createdat",
  "timestamp",
  "time",
  "posted",
  "posted_at",
  "review_date",
  "created",
  "created_time",
  "posted_date",
  "published_at",
  "tweet_created_at",
];

function matchColumn(headers: string[], aliases: string[]): string | undefined {
  // Exact match first - most reliable
  for (const alias of aliases) {
    const found = headers.find((header) => header === alias);
    if (found) return found;
  }
  // Token-sequence match - handles "product_review_text" without matching
  // unrelated words such as "postal_code" for the "post" alias.
  for (const alias of aliases) {
    const found = headers.find((header) => `_${header}_`.includes(`_${alias}_`));
    if (found) return found;
  }
  return undefined;
}

export function detectColumns(normalizedHeaders: string[]): DetectedColumns | null {
  const reviewColumn = matchColumn(normalizedHeaders, REVIEW_ALIASES);

  // Review column is mandatory - without it we can't proceed
  if (!reviewColumn) return null;

  return {
    reviewColumn,
    ratingColumn: matchColumn(normalizedHeaders, RATING_ALIASES),
    authorColumn: matchColumn(normalizedHeaders, AUTHOR_ALIASES),
    dateColumn: matchColumn(normalizedHeaders, DATE_ALIASES),
  };
}

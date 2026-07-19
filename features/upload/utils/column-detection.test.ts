import { describe, it, expect } from "vitest";
import { detectColumns } from "./column-detection";

describe("detectColumns", () => {
  it("detects all four columns by exact name", () => {
    const result = detectColumns(["review", "rating", "author", "date"]);
    expect(result).toEqual({
      reviewColumn: "review",
      ratingColumn: "rating",
      authorColumn: "author",
      dateColumn: "date",
    });
  });

  it("returns null when no review-like column exists", () => {
    expect(detectColumns(["price", "sku", "quantity"])).toBeNull();
  });

  it("matches common aliases", () => {
    const result = detectColumns(["comment", "stars", "reviewer", "timestamp"]);
    expect(result?.reviewColumn).toBe("comment");
    expect(result?.ratingColumn).toBe("stars");
    expect(result?.authorColumn).toBe("reviewer");
    expect(result?.dateColumn).toBe("timestamp");
  });

  it("matches Xquik CSV export headers after normalization", () => {
    const result = detectColumns(["tweet_text", "retweet_count", "user_name", "tweet_created_at"]);
    expect(result).toEqual({
      reviewColumn: "tweet_text",
      ratingColumn: undefined,
      authorColumn: "user_name",
      dateColumn: "tweet_created_at",
    });
  });

  it("matches social post export aliases", () => {
    const result = detectColumns(["post_text", "x_handle", "published_at"]);
    expect(result).toEqual({
      reviewColumn: "post_text",
      ratingColumn: undefined,
      authorColumn: "x_handle",
      dateColumn: "published_at",
    });
  });

  it("matches via substring when no exact alias is present", () => {
    const result = detectColumns(["product_review_text", "overall_rating"]);
    expect(result?.reviewColumn).toBe("product_review_text");
    expect(result?.ratingColumn).toBe("overall_rating");
  });

  it("does not treat short header fragments as aliases", () => {
    expect(detectColumns(["at", "id"])).toBeNull();
    expect(detectColumns(["review", "at", "id"])).toEqual({
      reviewColumn: "review",
      ratingColumn: undefined,
      authorColumn: undefined,
      dateColumn: undefined,
    });
  });

  it("does not match aliases inside unrelated normalized words", () => {
    expect(detectColumns(["postal_code", "candidate", "contest"])).toBeNull();
    expect(detectColumns(["review", "postal_code", "candidate"])).toEqual({
      reviewColumn: "review",
      ratingColumn: undefined,
      authorColumn: undefined,
      dateColumn: undefined,
    });
  });

  it("leaves optional columns undefined when absent", () => {
    const result = detectColumns(["feedback"]);
    expect(result?.reviewColumn).toBe("feedback");
    expect(result?.ratingColumn).toBeUndefined();
    expect(result?.authorColumn).toBeUndefined();
    expect(result?.dateColumn).toBeUndefined();
  });

  it("prefers an exact match over a substring match", () => {
    const result = detectColumns(["text", "review"]);
    // both are review aliases; exact 'review' alias should win in order
    expect(result?.reviewColumn).toBe("review");
  });
});

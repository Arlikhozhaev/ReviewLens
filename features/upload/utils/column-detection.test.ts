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

  it("matches via substring when no exact alias is present", () => {
    const result = detectColumns(["product_review_text", "overall_rating"]);
    expect(result?.reviewColumn).toBe("product_review_text");
    expect(result?.ratingColumn).toBe("overall_rating");
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

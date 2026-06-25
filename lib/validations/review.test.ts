import { describe, it, expect } from "vitest";
import {
  parseRating,
  sanitizeReviewText,
  analyzeRequestSchema,
  csvRowSchema,
} from "./review";

describe("parseRating", () => {
  it("parses plain integers and decimals", () => {
    expect(parseRating("5")).toBe(5);
    expect(parseRating("4.5")).toBe(4.5);
  });

  it("extracts a leading number from descriptive text", () => {
    expect(parseRating("5 out of 5 stars")).toBe(5);
    expect(parseRating("4/5")).toBe(4);
  });

  it("normalizes a 0-10 scale into 1-5", () => {
    expect(parseRating("10")).toBe(5);
    expect(parseRating("8")).toBe(4);
  });

  it("returns undefined for empty, junk, or out-of-range values", () => {
    expect(parseRating("")).toBeUndefined();
    expect(parseRating(undefined)).toBeUndefined();
    expect(parseRating("abc")).toBeUndefined();
    expect(parseRating("0")).toBeUndefined();
  });
});

describe("sanitizeReviewText", () => {
  it("strips null bytes and normalizes line endings", () => {
    expect(sanitizeReviewText("a\0b\r\nc\rd")).toBe("ab\nc\nd");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeReviewText("  hello  ")).toBe("hello");
  });
});

describe("analyzeRequestSchema", () => {
  const validReview = {
    id: "r1",
    text: "This product is great and works well.",
    rating: 5,
  };

  it("accepts a well-formed payload", () => {
    const parsed = analyzeRequestSchema.safeParse({
      reviews: [validReview],
      sourceType: "csv",
      fileName: "reviews.csv",
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty reviews array", () => {
    const parsed = analyzeRequestSchema.safeParse({
      reviews: [],
      sourceType: "csv",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an invalid sourceType", () => {
    const parsed = analyzeRequestSchema.safeParse({
      reviews: [validReview],
      sourceType: "ftp",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects a review whose text is too short", () => {
    const parsed = analyzeRequestSchema.safeParse({
      reviews: [{ id: "r1", text: "no" }],
      sourceType: "csv",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("csvRowSchema", () => {
  it("parses a rating string into a number", () => {
    const parsed = csvRowSchema.safeParse({
      review: "Solid build quality.",
      rating: "5 stars",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.rating).toBe(5);
  });

  it("requires non-empty review text", () => {
    const parsed = csvRowSchema.safeParse({ review: "" });
    expect(parsed.success).toBe(false);
  });
});

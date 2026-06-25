import { describe, it, expect } from "vitest";
import { parsePastedReviews } from "./parse-pasted-reviews";

describe("parsePastedReviews", () => {
  it("parses paragraph-separated reviews", () => {
    const input = `Great product, love the battery life.

Shipping was slow but quality is fine.

App crashes on login every time.`;

    const result = parsePastedReviews(input);
    expect(result.validRows).toBe(3);
    expect(result.reviews[0]?.text).toContain("battery");
    expect(result.reviews[2]?.text).toContain("crashes");
  });

  it("parses one review per line", () => {
    const input = [
      "Excellent support team, very responsive.",
      "Price is too high for what you get.",
      "Works exactly as advertised. Five stars.",
    ].join("\n");

    const result = parsePastedReviews(input);
    expect(result.validRows).toBe(3);
  });

  it("parses inline rating prefixes", () => {
    const input = "5/5 - Amazing headphones, best ANC I've tried.";
    const result = parsePastedReviews(input);
    expect(result.validRows).toBe(1);
    expect(result.reviews[0]?.rating).toBe(5);
    expect(result.reviews[0]?.text).toContain("Amazing headphones");
  });

  it("parses pasted CSV with headers", () => {
    const input = `review,rating
"Love it",5
"Broken on arrival",1`;

    const result = parsePastedReviews(input);
    expect(result.validRows).toBe(2);
    expect(result.reviews[0]?.rating).toBe(5);
    expect(result.detectedColumns.reviewColumn).toBe("review");
  });

  it("returns error for empty paste", () => {
    const result = parsePastedReviews("   ");
    expect(result.validRows).toBe(0);
    expect(result.errors[0]?.message).toMatch(/Paste at least one/i);
  });
});

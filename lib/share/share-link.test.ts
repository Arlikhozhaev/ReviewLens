import { describe, expect, it } from "vitest";
import { buildDashboardShareUrl, buildShareMailtoUrl } from "./share-link";

describe("share-link", () => {
  it("builds dashboard URLs without trailing slash on origin", () => {
    expect(
      buildDashboardShareUrl("https://review-lens-ten.vercel.app/", "abc123")
    ).toBe("https://review-lens-ten.vercel.app/dashboard/abc123");
  });

  it("builds mailto links with encoded subject and body", () => {
    const mailto = buildShareMailtoUrl(
      "https://example.com/dashboard/abc",
      "Q1 feedback"
    );
    expect(mailto.startsWith("mailto:?")).toBe(true);
    expect(mailto).toContain(encodeURIComponent("ReviewLens report: Q1 feedback"));
    expect(mailto).toContain(encodeURIComponent("https://example.com/dashboard/abc"));
  });
});

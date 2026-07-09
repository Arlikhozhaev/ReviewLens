import { test, expect } from "@playwright/test";

// A small, deterministic CSV the client parser will accept.
const CSV = [
  "review,rating,author",
  '"Battery dies within an hour",2,Sam',
  '"Love the bright display",5,Alex',
  '"Works great for the price",4,Jordan',
  '"Too expensive for what it does",2,Pat',
  '"Setup was quick and painless",5,Lee',
  '"Customer support was unhelpful",1,Robin',
].join("\n");

test.describe("golden path: upload → preview → submit", () => {
  test("authenticated user uploads a CSV and is handed off to the dashboard", async ({
    page,
  }) => {
    // Mock the create-analysis API so the test needs no database or OpenAI.
    await page.route("**/api/analysis", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { sessionId: "sess_e2e", shareableSlug: "e2e-slug" },
        }),
      });
    });

    // Process is owner-only; mock it so the dashboard handoff stays deterministic.
    await page.route("**/api/analysis/*/process", async (route) => {
      if (route.request().method() !== "POST") {
        await route.fallback();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { started: true, mode: "inline" },
        }),
      });
    });

    await page.goto("/analyze");

    // Upload the CSV via the (possibly hidden) file input.
    await page
      .locator('input[type="file"]')
      .setInputFiles({
        name: "reviews.csv",
        mimeType: "text/csv",
        buffer: Buffer.from(CSV),
      });

    // Client-side parse advances to the preview step.
    await expect(page.getByText(/parsed successfully/i)).toBeVisible();

    // Submit kicks off analysis and routes to the dashboard.
    await page.getByRole("button", { name: /start ai analysis/i }).click();

    await page.waitForURL(/\/dashboard\/e2e-slug/);
    expect(page.url()).toContain("/dashboard/e2e-slug");
  });
});

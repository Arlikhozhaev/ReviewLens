import { test, expect } from "@playwright/test";

// These run without a stored session — they verify the middleware gate.
test.describe("auth gating", () => {
  test("unauthenticated /analyze redirects to login", async ({ page }) => {
    await page.goto("/analyze");
    await page.waitForURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /sign in/i })
    ).toBeVisible();
  });

  test("unauthenticated /sessions redirects to login", async ({ page }) => {
    await page.goto("/sessions");
    await page.waitForURL(/\/login/);
  });

  test("login page renders the email form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/work email/i)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /continue with email/i })
    ).toBeVisible();
  });
});

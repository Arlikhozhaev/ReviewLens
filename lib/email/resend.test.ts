import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("preflightEmailDelivery", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = {
      ...originalEnv,
      DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
      OPENAI_API_KEY: "sk-test-key-for-unit-tests-only",
      RESEND_API_KEY: "re_test_key",
      EMAIL_FROM: "ReviewLens <onboarding@resend.dev>",
      RESEND_ACCOUNT_EMAIL: "owner@example.com",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("blocks sandbox sends to non-account recipients", async () => {
    const { preflightEmailDelivery } = await import("./resend");
    const result = preflightEmailDelivery("teammate@company.com");
    expect(result.canSend).toBe(false);
    expect(result.reason).toBe("sandbox_recipient_limit");
    expect(result.userMessage).toContain("owner@example.com");
  });

  it("allows sandbox sends to the Resend account email", async () => {
    const { preflightEmailDelivery } = await import("./resend");
    const result = preflightEmailDelivery("owner@example.com");
    expect(result.canSend).toBe(true);
  });

  it("blocks public sender domains like gmail.com", async () => {
    process.env.EMAIL_FROM = "ReviewLens <hello@gmail.com>";
    const { preflightEmailDelivery } = await import("./resend");
    const result = preflightEmailDelivery("teammate@company.com");
    expect(result.canSend).toBe(false);
    expect(result.reason).toBe("unverified_public_sender");
  });
});

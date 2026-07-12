import { describe, it, expect, vi, beforeEach } from "vitest";
import { OPENAI_MODELS } from "@/lib/constants";
import type { Cluster } from "../types";
import {
  chatJsonResponse,
  chatTextResponse,
  mockChatCreate,
  mockLogger,
  mockSleep,
  sampleTheme,
} from "../test-helpers";

vi.mock("@/lib/openai", () => ({
  openai: {
    embeddings: { create: vi.fn() },
    chat: {
      completions: {
        create: (...args: unknown[]) => mockChatCreate(...args),
      },
    },
  },
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return { ...actual, sleep: (...args: unknown[]) => mockSleep(...args) };
});

import {
  computeSentimentBreakdown,
  generateExecutiveSummary,
  summarizeCluster,
} from "./summarization";

function makeCluster(overrides: Partial<Cluster> = {}): Cluster {
  return {
    id: 0,
    reviewIds: ["r1", "r2"],
    embeddings: [
      [0, 0],
      [0.2, 0.1],
    ],
    texts: ["Battery dies quickly", "Needs charging twice a day"],
    centroid: [0, 0],
    ...overrides,
  };
}

describe("summarizeCluster", () => {
  const log = mockLogger();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSleep.mockResolvedValue(undefined);
  });

  it("parses JSON theme labels from the chat completion", async () => {
    mockChatCreate.mockResolvedValue(
      chatJsonResponse({
        label: "Battery life",
        description: "Users report short battery life.",
        sentiment: "negative",
      })
    );

    const { theme, tokensUsed } = await summarizeCluster(makeCluster(), 10, log);

    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: OPENAI_MODELS.SUMMARIZATION,
        response_format: { type: "json_object" },
      })
    );
    expect(theme.label).toBe("Battery life");
    expect(theme.sentiment).toBe("negative");
    expect(theme.reviewCount).toBe(2);
    expect(tokensUsed).toBeGreaterThan(0);
  });

  it("falls back to neutral theme labels when JSON is invalid", async () => {
    mockChatCreate.mockResolvedValue({
      choices: [{ message: { content: "not-json" } }],
      usage: { total_tokens: 12, prompt_tokens: 8, completion_tokens: 4 },
    });

    const { theme } = await summarizeCluster(makeCluster(), 4, log);

    expect(theme.label).toBe("Theme 1");
    expect(theme.sentiment).toBe("neutral");
  });

  it("returns a fallback theme after LLM errors are exhausted", async () => {
    mockChatCreate.mockRejectedValue(new Error("OpenAI down"));

    const { theme, tokensUsed } = await summarizeCluster(makeCluster(), 4, log);

    expect(mockChatCreate).toHaveBeenCalledTimes(3);
    expect(theme.label).toBe("Theme 1");
    expect(tokensUsed).toBe(0);
    expect(log.error).toHaveBeenCalled();
  });
});

describe("generateExecutiveSummary", () => {
  const log = mockLogger();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns trimmed prose from the executive summary completion", async () => {
    mockChatCreate.mockResolvedValue(
      chatTextResponse("  Customers love the display but worry about battery.  ")
    );

    const { summary, tokensUsed } = await generateExecutiveSummary(
      [sampleTheme()],
      10,
      4.2,
      log
    );

    expect(summary).toBe(
      "Customers love the display but worry about battery."
    );
    expect(tokensUsed).toBeGreaterThan(0);
    expect(mockChatCreate).toHaveBeenCalledWith(
      expect.objectContaining({ model: OPENAI_MODELS.SUMMARIZATION })
    );
  });

  it("returns a safe fallback when executive summary generation fails", async () => {
    mockChatCreate.mockRejectedValue(new Error("timeout"));

    const { summary, tokensUsed } = await generateExecutiveSummary(
      [sampleTheme()],
      10,
      undefined,
      log
    );

    expect(summary).toContain("Analysis complete");
    expect(tokensUsed).toBe(0);
  });
});

describe("computeSentimentBreakdown", () => {
  it("returns zeroed percentages when there are no themes", () => {
    expect(computeSentimentBreakdown([])).toEqual({
      positive: 0,
      negative: 0,
      neutral: 0,
      mixed: 0,
    });
  });

  it("weights sentiment by review counts across themes", () => {
    const breakdown = computeSentimentBreakdown([
      sampleTheme({ sentiment: "negative", reviewCount: 60 }),
      sampleTheme({
        clusterId: 1,
        sentiment: "positive",
        reviewCount: 40,
      }),
    ]);

    expect(breakdown.negative).toBe(60);
    expect(breakdown.positive).toBe(40);
    expect(
      breakdown.positive +
        breakdown.negative +
        breakdown.neutral +
        breakdown.mixed
    ).toBe(100);
  });
});

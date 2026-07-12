import { vi } from "vitest";
import type { ThemeAnalysis } from "./types";

export const mockEmbeddingsCreate = vi.fn();
export const mockChatCreate = vi.fn();
export const mockSleep = vi.fn().mockResolvedValue(undefined);

export function mockLogger() {
  return {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    stage: vi.fn(),
    openaiUsage: vi.fn(),
  };
}

export function embeddingResponse(
  count: number,
  dim = 4
): {
  data: { embedding: number[]; index: number }[];
  usage: { total_tokens: number; prompt_tokens: number };
} {
  return {
    data: Array.from({ length: count }, (_, index) => ({
      embedding: Array.from({ length: dim }, (_, axis) => index + axis * 0.01),
      index,
    })),
    usage: { total_tokens: count * 2, prompt_tokens: count },
  };
}

export function chatJsonResponse(payload: unknown, tokens = 42) {
  return {
    choices: [{ message: { content: JSON.stringify(payload) } }],
    usage: {
      total_tokens: tokens,
      prompt_tokens: tokens - 10,
      completion_tokens: 10,
    },
  };
}

export function chatTextResponse(text: string, tokens = 55) {
  return {
    choices: [{ message: { content: text } }],
    usage: {
      total_tokens: tokens,
      prompt_tokens: tokens - 15,
      completion_tokens: 15,
    },
  };
}

export function sampleTheme(overrides: Partial<ThemeAnalysis> = {}): ThemeAnalysis {
  return {
    clusterId: 0,
    label: "Battery life",
    description: "Customers mention short battery life.",
    sentiment: "negative",
    reviewCount: 5,
    percentage: 50,
    exampleQuotes: ["Battery dies fast"],
    ...overrides,
  };
}

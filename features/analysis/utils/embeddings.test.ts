import { describe, it, expect, vi, beforeEach } from "vitest";
import { OPENAI_MODELS, EMBEDDING_BATCH_SIZE } from "@/lib/constants";
import {
  embeddingResponse,
  mockEmbeddingsCreate,
  mockLogger,
  mockSleep,
} from "../test-helpers";

vi.mock("@/lib/openai", () => ({
  openai: {
    embeddings: { create: (...args: unknown[]) => mockEmbeddingsCreate(...args) },
    chat: { completions: { create: vi.fn() } },
  },
}));

vi.mock("@/lib/utils", async () => {
  const actual = await vi.importActual("@/lib/utils");
  return { ...actual, sleep: (...args: unknown[]) => mockSleep(...args) };
});

import { generateEmbeddings } from "./embeddings";

describe("generateEmbeddings", () => {
  const log = mockLogger();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSleep.mockResolvedValue(undefined);
    mockEmbeddingsCreate.mockResolvedValue(embeddingResponse(2));
  });

  it("calls OpenAI with the embedding model and batched input", async () => {
    const reviews = [
      { id: "r1", text: "Great product" },
      { id: "r2", text: "Poor support" },
    ];

    const result = await generateEmbeddings(reviews, log);

    expect(mockEmbeddingsCreate).toHaveBeenCalledWith({
      model: OPENAI_MODELS.EMBEDDING,
      input: ["Great product", "Poor support"],
      encoding_format: "float",
    });
    expect(result.reviews).toHaveLength(2);
    expect(result.reviews[0]?.id).toBe("r1");
    expect(result.totalTokens).toBeGreaterThan(0);
  });

  it("retries on 429 rate limit before succeeding", async () => {
    const rateLimitError = Object.assign(new Error("Rate limited"), {
      status: 429,
    });

    mockEmbeddingsCreate
      .mockRejectedValueOnce(rateLimitError)
      .mockResolvedValueOnce(embeddingResponse(1));

    const result = await generateEmbeddings(
      [{ id: "r1", text: "One review" }],
      log
    );

    expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
    expect(mockSleep).toHaveBeenCalled();
    expect(result.reviews).toHaveLength(1);
  });

  it("throws after exhausting embedding retries", async () => {
    mockEmbeddingsCreate.mockRejectedValue(new Error("OpenAI unavailable"));

    await expect(
      generateEmbeddings([{ id: "r1", text: "Fails" }], log)
    ).rejects.toThrow(/failed after 3 attempts/);
  });

  it("chunks large inputs by EMBEDDING_BATCH_SIZE", async () => {
    const reviews = Array.from({ length: EMBEDDING_BATCH_SIZE + 5 }, (_, i) => ({
      id: `r-${i}`,
      text: `Review ${i}`,
    }));

    mockEmbeddingsCreate.mockImplementation(async (args: { input: string[] }) =>
      embeddingResponse(args.input.length)
    );

    const result = await generateEmbeddings(reviews, log);

    expect(mockEmbeddingsCreate).toHaveBeenCalledTimes(2);
    expect(result.reviews).toHaveLength(reviews.length);
  });
});

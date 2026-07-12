import { describe, it, expect, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";
import {
  chatJsonResponse,
  chatTextResponse,
  embeddingResponse,
  mockChatCreate,
  mockEmbeddingsCreate,
  mockSleep,
} from "./test-helpers";

const mockFindMany = vi.fn();
const mockResultCreate = vi.fn();
const mockReviewUpdateMany = vi.fn();
const mockSessionUpdate = vi.fn();
const mockSessionUpdateMany = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    review: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      updateMany: (...args: unknown[]) => mockReviewUpdateMany(...args),
    },
    analysisResult: {
      create: (...args: unknown[]) => mockResultCreate(...args),
    },
    analysisSession: {
      update: (...args: unknown[]) => mockSessionUpdate(...args),
      updateMany: (...args: unknown[]) => mockSessionUpdateMany(...args),
    },
  },
}));

vi.mock("@/lib/openai", () => ({
  openai: {
    embeddings: {
      create: (...args: unknown[]) => mockEmbeddingsCreate(...args),
    },
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

vi.mock("@/lib/logger", () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    stage: vi.fn(),
    openaiUsage: vi.fn(),
  }),
}));

import { runAnalysisPipeline } from "./pipeline";

const SESSION_ID = "sess_pipeline_1";

function makeDbReviews(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    id: `review-${index}`,
    text: `Review ${index} about battery and screen quality`,
    rating: index % 2 === 0 ? 4 : 2,
  }));
}

function mockOpenAiHappyPath(reviewCount: number) {
  mockEmbeddingsCreate.mockImplementation(async (args: { input: string[] }) =>
    embeddingResponse(args.input.length)
  );

  mockChatCreate.mockImplementation(async (args: {
    response_format?: { type: string };
  }) => {
    if (args.response_format?.type === "json_object") {
      return chatJsonResponse({
        label: "Product quality",
        description: "Mixed feedback on quality.",
        sentiment: "mixed",
      });
    }
    return chatTextResponse("Executive summary for product reviews.");
  });

  mockFindMany.mockResolvedValue(makeDbReviews(reviewCount));
  mockResultCreate.mockResolvedValue({ id: "result-1" });
  mockReviewUpdateMany.mockResolvedValue({ count: reviewCount });
  mockSessionUpdate.mockResolvedValue({ id: SESSION_ID, status: "COMPLETED" });
  mockSessionUpdateMany.mockResolvedValue({ count: 1 });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSleep.mockResolvedValue(undefined);
});

describe("runAnalysisPipeline", () => {
  it("completes the happy path and marks the session COMPLETED", async () => {
    mockOpenAiHappyPath(20);

    await runAnalysisPipeline(SESSION_ID, { requestId: "req-1" });

    expect(mockFindMany).toHaveBeenCalledWith({
      where: { sessionId: SESSION_ID },
      select: { id: true, text: true, rating: true },
    });
    expect(mockEmbeddingsCreate).toHaveBeenCalled();
    expect(mockChatCreate).toHaveBeenCalled();
    expect(mockResultCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sessionId: SESSION_ID,
          executiveSummary: expect.any(String),
          processingMs: expect.any(Number),
        }),
      })
    );
    expect(mockSessionUpdate).toHaveBeenCalledWith({
      where: { id: SESSION_ID },
      data: { status: "COMPLETED" },
    });
  });

  it("fails when the session has no reviews", async () => {
    mockFindMany.mockResolvedValue([]);
    mockSessionUpdateMany.mockResolvedValue({ count: 1 });

    await expect(runAnalysisPipeline(SESSION_ID)).rejects.toThrow(
      "No reviews found in session"
    );

    expect(mockSessionUpdateMany).toHaveBeenCalledWith({
      where: { id: SESSION_ID, status: { not: "COMPLETED" } },
      data: { status: "FAILED" },
    });
    expect(mockResultCreate).not.toHaveBeenCalled();
  });

  it("exits cleanly when a result row already exists (idempotent claim)", async () => {
    mockOpenAiHappyPath(12);
    mockResultCreate.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint failed", {
        code: "P2002",
        clientVersion: "6.0.0",
      })
    );

    await expect(
      runAnalysisPipeline(SESSION_ID)
    ).resolves.toBeUndefined();

    expect(mockSessionUpdate).not.toHaveBeenCalled();
  });

  it("marks the session FAILED when embedding generation fails", async () => {
    mockFindMany.mockResolvedValue(makeDbReviews(3));
    mockEmbeddingsCreate.mockRejectedValue(new Error("OpenAI unavailable"));
    mockSessionUpdateMany.mockResolvedValue({ count: 1 });

    await expect(runAnalysisPipeline(SESSION_ID)).rejects.toThrow(
      /failed after 3 attempts/
    );

    expect(mockSessionUpdateMany).toHaveBeenCalledWith({
      where: { id: SESSION_ID, status: { not: "COMPLETED" } },
      data: { status: "FAILED" },
    });
  });

  it("uses capped k for large review sets (n > 120)", async () => {
    mockOpenAiHappyPath(130);

    await runAnalysisPipeline(SESSION_ID);

    const themeCalls = mockChatCreate.mock.calls.filter(
      (call) => call[0]?.response_format?.type === "json_object"
    );
    expect(themeCalls.length).toBeLessThanOrEqual(8);
    expect(themeCalls.length).toBeGreaterThan(0);
  });

  it("uses minimum k=2 for small review sets (n < 15)", async () => {
    mockOpenAiHappyPath(8);

    await runAnalysisPipeline(SESSION_ID);

    const themeCalls = mockChatCreate.mock.calls.filter(
      (call) => call[0]?.response_format?.type === "json_object"
    );
    expect(themeCalls).toHaveLength(2);
  });
});

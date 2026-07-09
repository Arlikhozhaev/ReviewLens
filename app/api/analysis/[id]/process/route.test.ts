import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextResponse } from "next/server";

const mockRequireAuthUser = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdateMany = vi.fn();
const mockCheckRateLimit = vi.fn();
const mockTriggerPipeline = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAuthUser: () => mockRequireAuthUser(),
  getRequestId: () => "test-request-id",
  unauthorizedResponse: () =>
    NextResponse.json(
      {
        success: false,
        error: "Sign in required",
        code: "UNAUTHORIZED",
      },
      { status: 401 }
    ),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analysisSession: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  getClientIp: () => "127.0.0.1",
  rateLimitResponseHeaders: () => ({}),
}));

vi.mock("@/lib/jobs/pipeline-trigger", () => ({
  triggerAnalysisPipeline: (...args: unknown[]) => mockTriggerPipeline(...args),
}));

import { POST } from "./route";

const SLUG = "process-slug-abc";
const SESSION_ID = "sess_process_1";
const OWNER_ID = "user_owner_1";
const OTHER_ID = "user_other_1";

function callPost(slug = SLUG) {
  return POST(new Request(`http://localhost/api/analysis/${slug}/process`, {
    method: "POST",
  }), {
    params: { id: slug },
  });
}

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: OWNER_ID,
    status: "PENDING",
    updatedAt: new Date(),
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockCheckRateLimit.mockResolvedValue({ ok: true });
  mockRequireAuthUser.mockResolvedValue({ userId: OWNER_ID, session: {} });
  mockFindUnique.mockResolvedValue(makeSession());
  mockUpdateMany.mockResolvedValue({ count: 1 });
  mockTriggerPipeline.mockResolvedValue("inline");
});

describe("POST /api/analysis/[id]/process", () => {
  it("returns 401 when unauthenticated", async () => {
    mockRequireAuthUser.mockResolvedValue(null);

    const res = await callPost();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.code).toBe("UNAUTHORIZED");
    expect(mockTriggerPipeline).not.toHaveBeenCalled();
  });

  it("returns 403 when authenticated user is not the session owner", async () => {
    mockRequireAuthUser.mockResolvedValue({ userId: OTHER_ID, session: {} });

    const res = await callPost();
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.code).toBe("FORBIDDEN");
    expect(mockTriggerPipeline).not.toHaveBeenCalled();
  });

  it("starts the pipeline for the session owner", async () => {
    const res = await callPost();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ started: true, mode: "inline" });
    expect(mockTriggerPipeline).toHaveBeenCalledWith({
      sessionId: SESSION_ID,
      requestId: "test-request-id",
    });
  });

  it("returns 429 when rate limited", async () => {
    mockCheckRateLimit.mockResolvedValue({
      ok: false,
      retryAfterSec: 30,
    });

    const res = await callPost();
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.success).toBe(false);
    expect(body.code).toBe("RATE_LIMITED");
    expect(mockRequireAuthUser).not.toHaveBeenCalled();
    expect(mockTriggerPipeline).not.toHaveBeenCalled();
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockRequireAuthUser = vi.fn();
const mockFindUnique = vi.fn();

vi.mock("@/lib/auth-helpers", () => ({
  requireAuthUser: () => mockRequireAuthUser(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analysisSession: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: vi.fn(),
    },
    analysisResult: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/features/analysis", () => ({
  runAnalysisPipeline: vi.fn(),
}));

import { GET } from "./route";

function callGet(slug = "debug-slug", nodeEnv: string) {
  vi.stubEnv("NODE_ENV", nodeEnv);
  return GET(new Request(`http://localhost/api/debug/pipeline/${slug}`), {
    params: { id: slug },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAuthUser.mockResolvedValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("GET /api/debug/pipeline/[id]", () => {
  it("returns 404 in production", async () => {
    const res = await callGet("any-slug", "production");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
    expect(mockRequireAuthUser).not.toHaveBeenCalled();
  });

  it("returns 404 in development when unauthenticated", async () => {
    const res = await callGet("any-slug", "development");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });

  it("returns 404 in development for non-owner", async () => {
    mockRequireAuthUser.mockResolvedValue({ userId: "user_a", session: {} });
    mockFindUnique.mockResolvedValue({
      id: "sess_1",
      userId: "user_b",
      status: "COMPLETED",
    });

    const res = await callGet("owned-by-b", "development");
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("Not found");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  hashSharePassword,
  issueShareAccessToken,
  shareAccessCookieName,
} from "@/lib/share-access";

const mockFindUnique = vi.fn();
const mockAuth = vi.fn();
const mockCookiesGet = vi.fn();

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analysisSession: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
    },
  },
}));

vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => mockCookiesGet(name),
  }),
}));

import { GET } from "./route";

const SLUG = "test-slug-abc";
const SESSION_ID = "sess_status_1";
const OWNER_ID = "user_owner_1";

const mockResult = {
  executiveSummary: "Customers love the product.",
  sentimentData: { positive: 60, negative: 20, neutral: 15, mixed: 5 },
  themesData: [{ clusterId: 1, label: "Quality", reviewCount: 10 }],
  averageRating: 4.2,
  processingMs: 12_000,
};

function makeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: SESSION_ID,
    userId: OWNER_ID,
    status: "COMPLETED",
    totalReviews: 42,
    updatedAt: new Date(),
    sharePasswordHash: null,
    shareExpiresAt: null,
    result: mockResult,
    ...overrides,
  };
}

function callGet(slug = SLUG) {
  return GET(new Request(`http://localhost/api/analysis/${slug}/status`), {
    params: { id: slug },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);
  mockCookiesGet.mockReturnValue(undefined);
});

describe("GET /api/analysis/[id]/status", () => {
  it("returns 403 for an unknown slug (no result leaked)", async () => {
    mockFindUnique.mockResolvedValue(null);

    const res = await callGet("random-unknown-slug");
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.success).toBe(false);
    expect(body.data).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("executiveSummary");
  });

  it("returns full result for the session owner", async () => {
    mockFindUnique.mockResolvedValue(makeSession());
    mockAuth.mockResolvedValue({ user: { id: OWNER_ID } });

    const res = await callGet();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe("COMPLETED");
    expect(body.data.totalReviews).toBe(42);
    expect(body.data.result).toMatchObject({
      executiveSummary: mockResult.executiveSummary,
      averageRating: mockResult.averageRating,
      processingMs: mockResult.processingMs,
    });
    expect(body.data.result.themes).toHaveLength(1);
  });

  it("returns full result for a share viewer with a valid cookie", async () => {
    const token = issueShareAccessToken(SESSION_ID);
    mockFindUnique.mockResolvedValue(
      makeSession({ sharePasswordHash: hashSharePassword("secret") })
    );
    mockCookiesGet.mockImplementation((name: string) =>
      name === shareAccessCookieName(SESSION_ID)
        ? { value: token }
        : undefined
    );

    const res = await callGet();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.result?.executiveSummary).toBe(
      mockResult.executiveSummary
    );
  });

  it("returns 401 when share password is required but cookie is missing", async () => {
    mockFindUnique.mockResolvedValue(
      makeSession({ sharePasswordHash: hashSharePassword("secret") })
    );

    const res = await callGet();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error).toBe("Password required");
    expect(body.data).toBeUndefined();
    expect(JSON.stringify(body)).not.toContain("executiveSummary");
  });
});

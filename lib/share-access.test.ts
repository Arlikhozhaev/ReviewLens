import { describe, it, expect } from "vitest";
import {
  hashSharePassword,
  verifySharePassword,
  isShareExpired,
  issueShareAccessToken,
  verifyShareAccessToken,
  shareAccessCookieName,
  checkShareAccess,
} from "./share-access";

describe("share password hashing", () => {
  it("verifies a correct password", () => {
    const stored = hashSharePassword("hunter2");
    expect(verifySharePassword("hunter2", stored)).toBe(true);
  });

  it("rejects an incorrect password", () => {
    const stored = hashSharePassword("hunter2");
    expect(verifySharePassword("wrong", stored)).toBe(false);
  });

  it("produces a unique salt per hash", () => {
    expect(hashSharePassword("same")).not.toBe(hashSharePassword("same"));
  });

  it("rejects a malformed stored value", () => {
    expect(verifySharePassword("x", "not-a-valid-hash")).toBe(false);
  });
});

describe("isShareExpired", () => {
  it("is false for null/undefined", () => {
    expect(isShareExpired(null)).toBe(false);
    expect(isShareExpired(undefined)).toBe(false);
  });

  it("is true for a past date", () => {
    expect(isShareExpired(new Date(Date.now() - 1000))).toBe(true);
  });

  it("is false for a future date", () => {
    expect(isShareExpired(new Date(Date.now() + 60_000))).toBe(false);
  });
});

describe("share access tokens", () => {
  it("verifies a freshly issued token for the same session", () => {
    const token = issueShareAccessToken("sess_1");
    expect(verifyShareAccessToken(token, "sess_1")).toBe(true);
  });

  it("rejects a token issued for a different session", () => {
    const token = issueShareAccessToken("sess_1");
    expect(verifyShareAccessToken(token, "sess_2")).toBe(false);
  });

  it("rejects a tampered token", () => {
    const token = issueShareAccessToken("sess_1");
    const tampered = token.slice(0, -2) + "00";
    expect(verifyShareAccessToken(tampered, "sess_1")).toBe(false);
  });

  it("rejects undefined and garbage tokens", () => {
    expect(verifyShareAccessToken(undefined, "sess_1")).toBe(false);
    expect(verifyShareAccessToken("garbage", "sess_1")).toBe(false);
  });

  it("rejects an expired token", () => {
    const expired = `${Date.now() - 1000}.deadbeef`;
    expect(verifyShareAccessToken(expired, "sess_1")).toBe(false);
  });
});

describe("shareAccessCookieName", () => {
  it("namespaces by session id", () => {
    expect(shareAccessCookieName("abc")).toBe("rl_share_abc");
  });
});

describe("checkShareAccess", () => {
  const baseSession = {
    id: "sess_1",
    sharePasswordHash: null as string | null,
    shareExpiresAt: null as Date | null,
  };

  it("allows access when no password is set and link is not expired", () => {
    expect(checkShareAccess(baseSession, undefined)).toEqual({
      allowed: true,
    });
  });

  it("returns 410 when the share link has expired", () => {
    const result = checkShareAccess(
      {
        ...baseSession,
        shareExpiresAt: new Date(Date.now() - 1000),
      },
      undefined
    );
    expect(result).toEqual({
      allowed: false,
      status: 410,
      error: "This link has expired.",
    });
  });

  it("returns 401 when a password is required but cookie is missing", () => {
    const result = checkShareAccess(
      {
        ...baseSession,
        sharePasswordHash: hashSharePassword("secret"),
      },
      undefined
    );
    expect(result).toEqual({
      allowed: false,
      status: 401,
      error: "Password required",
    });
  });

  it("allows access when a valid share cookie is present", () => {
    const token = issueShareAccessToken("sess_1");
    const result = checkShareAccess(
      {
        ...baseSession,
        sharePasswordHash: hashSharePassword("secret"),
      },
      token
    );
    expect(result).toEqual({ allowed: true });
  });
});

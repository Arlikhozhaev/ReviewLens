import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRandomBytes = vi.hoisted(() => vi.fn());

vi.mock("crypto", () => ({
  randomBytes: (size: number) => mockRandomBytes(size),
}));

import { generateShareableSlug } from "./utils";

describe("generateShareableSlug", () => {
  beforeEach(() => {
    mockRandomBytes.mockReset();
  });

  it("encodes 12 random bytes as base64url", () => {
    const bytes = Buffer.from("abcdefghijkl", "utf8");
    mockRandomBytes.mockReturnValue(bytes);

    const slug = generateShareableSlug();

    expect(mockRandomBytes).toHaveBeenCalledWith(12);
    expect(slug).toBe(bytes.toString("base64url"));
    expect(slug).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("returns distinct slugs when randomBytes yields different values", () => {
    mockRandomBytes
      .mockReturnValueOnce(Buffer.alloc(12, 1))
      .mockReturnValueOnce(Buffer.alloc(12, 2));

    const first = generateShareableSlug();
    const second = generateShareableSlug();

    expect(first).not.toBe(second);
  });
});

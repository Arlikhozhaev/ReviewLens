import { describe, it, expect } from "vitest";
import {
  clusterReviews,
  determineK,
  getRepresentativeTexts,
} from "./clustering";
import type { EmbeddedReview } from "../types";

function makeEmbedded(count: number, dim = 3): EmbeddedReview[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `review-${index}`,
    text: `Review text ${index}`,
    embedding: Array.from({ length: dim }, (__, axis) => {
      if (axis === 0) return index < count / 2 ? 0 : 10;
      return index * 0.1 + axis;
    }),
  }));
}

describe("determineK", () => {
  it("returns minimum k=2 for small datasets (n < 15)", () => {
    expect(determineK(1)).toBe(2);
    expect(determineK(10)).toBe(2);
    expect(determineK(14)).toBe(2);
  });

  it("scales k with review count (1 cluster per 15 reviews)", () => {
    expect(determineK(30)).toBe(2);
    expect(determineK(45)).toBe(3);
    expect(determineK(75)).toBe(5);
  });

  it("caps k at 8 for large datasets (n > 120)", () => {
    expect(determineK(120)).toBe(8);
    expect(determineK(200)).toBe(8);
    expect(determineK(500)).toBe(8);
  });
});

describe("clusterReviews", () => {
  it("assigns every review to a non-empty cluster", () => {
    const embedded = makeEmbedded(12);
    const clusters = clusterReviews(embedded, determineK(embedded.length));

    expect(clusters.length).toBeGreaterThan(0);
    const assigned = clusters.reduce((sum, c) => sum + c.reviewIds.length, 0);
    expect(assigned).toBe(embedded.length);
    expect(clusters.every((c) => c.reviewIds.length > 0)).toBe(true);
  });

  it("handles n < 15 with k=2 without empty output", () => {
    const embedded = makeEmbedded(8);
    const clusters = clusterReviews(embedded, 2);

    expect(clusters).toHaveLength(2);
    expect(clusters.reduce((sum, c) => sum + c.reviewIds.length, 0)).toBe(8);
  });
});

describe("getRepresentativeTexts", () => {
  it("returns texts closest to the cluster centroid", () => {
    const cluster = {
      id: 0,
      reviewIds: ["a", "b", "c"],
      embeddings: [
        [0, 0],
        [5, 5],
        [0.1, 0.1],
      ],
      texts: ["far", "farthest", "near"],
      centroid: [0, 0],
    };

    const reps = getRepresentativeTexts(cluster, 2);

    expect(reps).toHaveLength(2);
    expect(reps[0]).toBe("far");
    expect(reps).toContain("near");
  });
});

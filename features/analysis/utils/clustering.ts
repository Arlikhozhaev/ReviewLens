import type { Cluster, EmbeddedReview } from "../types";

// ── Math primitives ───────────────────────────────────────────────────────────

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function addVectors(a: number[], b: number[]): number[] {
  return a.map((v, i) => v + (b[i] ?? 0));
}

function zeroVector(dim: number): number[] {
  return new Array<number>(dim).fill(0);
}

// ── k-means++ initialization ──────────────────────────────────────────────────
// Picks initial centroids weighted by distance² from already-chosen centroids.
// Dramatically reduces the chance of a bad clustering.

function initializeCentroids(points: number[][], k: number): number[][] {
  const centroids: number[][] = [];

  // First centroid: uniformly random
  const firstIdx = Math.floor(Math.random() * points.length);
  centroids.push([...(points[firstIdx] ?? [])]);

  for (let c = 1; c < k; c++) {
    // Distance² from each point to its nearest centroid
    const distances = points.map((point) => {
      const minDist = Math.min(
        ...centroids.map((centroid) => euclideanDistance(point, centroid))
      );
      return minDist * minDist;
    });

    const totalDist = distances.reduce((a, b) => a + b, 0);
    let target = Math.random() * totalDist;

    for (let i = 0; i < distances.length; i++) {
      target -= distances[i] ?? 0;
      if (target <= 0) {
        centroids.push([...(points[i] ?? [])]);
        break;
      }
    }

    // Fallback if floating point causes issues
    if (centroids.length <= c) {
      centroids.push([...(points[points.length - 1] ?? [])]);
    }
  }

  return centroids;
}

// ── k-means ───────────────────────────────────────────────────────────────────

function runKMeans(
  points: number[][],
  k: number,
  maxIterations = 100
): { assignments: number[]; centroids: number[][] } {
  const dim = points[0]?.length ?? 0;
  let centroids = initializeCentroids(points, k);
  let assignments = new Array<number>(points.length).fill(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;

    // Assignment step
    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (!point) continue;

      let minDist = Infinity;
      let best = 0;

      for (let c = 0; c < centroids.length; c++) {
        const dist = euclideanDistance(point, centroids[c] ?? []);
        if (dist < minDist) {
          minDist = dist;
          best = c;
        }
      }

      if (assignments[i] !== best) {
        assignments[i] = best;
        changed = true;
      }
    }

    if (!changed) {
      console.log(`[clustering] Converged after ${iter + 1} iterations`);
      break;
    }

    // Update step — recompute centroids as cluster means
    const sums: number[][] = Array.from({ length: k }, () =>
      zeroVector(dim)
    );
    const counts = new Array<number>(k).fill(0);

    for (let i = 0; i < points.length; i++) {
      const clusterId = assignments[i] ?? 0;
      sums[clusterId] = addVectors(sums[clusterId] ?? zeroVector(dim), points[i] ?? []);
      counts[clusterId] = (counts[clusterId] ?? 0) + 1;
    }

    for (let c = 0; c < k; c++) {
      const count = counts[c] ?? 0;
      if (count > 0) {
        centroids[c] = (sums[c] ?? zeroVector(dim)).map((v) => v / count);
      }
    }
  }

  return { assignments, centroids };
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Determine a sensible k given the number of reviews.
 * 1 cluster per 15 reviews, min 2, max 8.
 */
export function determineK(n: number): number {
  return Math.max(2, Math.min(8, Math.round(n / 15)));
}

/**
 * Cluster embedded reviews and return grouped Cluster objects.
 */
export function clusterReviews(
  embedded: EmbeddedReview[],
  k: number
): Cluster[] {
  const embeddings = embedded.map((r) => r.embedding);
  const { assignments, centroids } = runKMeans(embeddings, k);

  // Initialize empty clusters
  const clusters: Cluster[] = Array.from({ length: k }, (_, i) => ({
    id: i,
    reviewIds: [],
    embeddings: [],
    texts: [],
    centroid: centroids[i] ?? [],
  }));

  // Assign each review to its cluster
  for (let i = 0; i < embedded.length; i++) {
    const review = embedded[i];
    const clusterId = assignments[i];
    if (!review || clusterId === undefined) continue;

    const cluster = clusters[clusterId];
    if (!cluster) continue;

    cluster.reviewIds.push(review.id);
    cluster.embeddings.push(review.embedding);
    cluster.texts.push(review.text);
  }

  // Remove empty clusters (can happen with very small datasets)
  return clusters.filter((c) => c.reviewIds.length > 0);
}

/**
 * Return the n reviews closest to the cluster centroid.
 * These are the most "representative" — they're most average for that cluster.
 */
export function getRepresentativeTexts(
  cluster: Cluster,
  n = 5
): string[] {
  const withDistance = cluster.texts.map((text, i) => ({
    text,
    distance: euclideanDistance(cluster.embeddings[i] ?? [], cluster.centroid),
  }));

  return withDistance
    .sort((a, b) => a.distance - b.distance)
    .slice(0, n)
    .map((r) => r.text);
}
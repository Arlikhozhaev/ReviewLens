import { prisma } from "@/lib/prisma";
import { generateEmbeddings } from "./utils/embeddings";
import { clusterReviews, determineK } from "./utils/clustering";
import {
  summarizeCluster,
  generateExecutiveSummary,
  computeSentimentBreakdown,
} from "./utils/summarization";

export async function runAnalysisPipeline(sessionId: string): Promise<void> {
  const startTime = Date.now();

  console.log(`[pipeline] Starting for session ${sessionId}`);

  // ── Mark as processing ──────────────────────────────────────────────────────
  await prisma.analysisSession.update({
    where: { id: sessionId },
    data: { status: "PROCESSING" },
  });

  try {
    // ── Load reviews from DB ──────────────────────────────────────────────────
    const dbReviews = await prisma.review.findMany({
      where: { sessionId },
      select: { id: true, text: true, rating: true },
    });

    if (dbReviews.length === 0) {
      throw new Error("No reviews found in session");
    }

    console.log(`[pipeline] Loaded ${dbReviews.length} reviews`);

    // ── Stage 1: Embeddings ───────────────────────────────────────────────────
    const embedded = await generateEmbeddings(
      dbReviews.map((r) => ({ id: r.id, text: r.text }))
    );

    // ── Stage 2: Clustering ───────────────────────────────────────────────────
    const k = determineK(embedded.length);
    console.log(`[pipeline] Clustering ${embedded.length} reviews into ${k} groups`);

    const clusters = clusterReviews(embedded, k);
    console.log(`[pipeline] Got ${clusters.length} non-empty clusters`);

    // ── Stage 3: Summarize each cluster (parallel, with rate-limit safety) ────
    // Process clusters in parallel — each cluster is one GPT call.
    // For 8 clusters this is 8 concurrent calls, well within rate limits.
    const themes = await Promise.all(
      clusters.map((cluster) =>
        summarizeCluster(cluster, embedded.length)
      )
    );

    // ── Stage 4: Executive summary ────────────────────────────────────────────
    const ratings = dbReviews
      .map((r) => r.rating)
      .filter((r): r is number => r !== null && r !== undefined);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : undefined;

    const executiveSummary = await generateExecutiveSummary(
      themes,
      embedded.length,
      averageRating
    );

    const sentimentBreakdown = computeSentimentBreakdown(themes);
    const processingMs = Date.now() - startTime;

    // ── Stage 5: Persist result ───────────────────────────────────────────────
    await prisma.analysisResult.create({
    data: {
        sessionId,
        executiveSummary,
        sentimentData: sentimentBreakdown as unknown as import("@prisma/client").Prisma.InputJsonValue,
        themesData: themes as unknown as import("@prisma/client").Prisma.InputJsonValue,
        averageRating: averageRating ?? null,
        processingMs,
      },
    });

    // Update reviews with their cluster assignments
    await Promise.all(
      clusters.flatMap((cluster) =>
        cluster.reviewIds.map((reviewId) =>
          prisma.review.update({
            where: { id: reviewId },
            data: { clusterId: cluster.id },
          })
        )
      )
    );

    // ── Mark as completed ─────────────────────────────────────────────────────
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    console.log(`[pipeline] Completed in ${processingMs}ms`);
  } catch (error) {
    console.error("[pipeline] Failed:", error);

    // Always mark as failed so the UI stops polling
    await prisma.analysisSession
      .update({
        where: { id: sessionId },
        data: { status: "FAILED" },
      })
      .catch(console.error);

    throw error;
  }
}
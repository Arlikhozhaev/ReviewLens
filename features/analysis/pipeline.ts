import { Prisma } from "@prisma/client";
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

    // ── Stage 3: Summarize each cluster ───────────────────────────────────────
    const themes = await Promise.all(
      clusters.map((cluster) => summarizeCluster(cluster, embedded.length))
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
    // sessionId is @unique on AnalysisResult. If a second pipeline run ever
    // reaches this point after another one already succeeded — despite the
    // atomic claim above, e.g. from a manual re-trigger — this insert throws
    // P2002. That's not a real failure, it means the work is already done,
    // so we exit cleanly instead of falling through to the catch block.
    try {
      await prisma.analysisResult.create({
        data: {
          sessionId,
          executiveSummary,
          sentimentData: sentimentBreakdown as unknown as Prisma.InputJsonValue,
          themesData: themes as unknown as Prisma.InputJsonValue,
          averageRating: averageRating ?? null,
          processingMs,
        },
      });
    } catch (createError) {
      if (
        createError instanceof Prisma.PrismaClientKnownRequestError &&
        createError.code === "P2002"
      ) {
        console.warn(
          `[pipeline] Result already exists for session ${sessionId} — duplicate run, exiting cleanly`
        );
        return;
      }
      throw createError;
    }

    // One updateMany per cluster (max 8 queries) instead of one per review —
    // looping per-review on a 500-row upload would open hundreds of parallel
    // connections and exhaust Supabase's pooler.
    await Promise.all(
      clusters.map((cluster) =>
        prisma.review.updateMany({
          where: { id: { in: cluster.reviewIds } },
          data: { clusterId: cluster.id },
        })
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

    // Only downgrade to FAILED if the session isn't already COMPLETED.
    // This is the second line of defense: even if two runs somehow both
    // get this far, a failing one must never overwrite a status that a
    // successful one already set.
    await prisma.analysisSession
      .updateMany({
        where: { id: sessionId, status: { not: "COMPLETED" } },
        data: { status: "FAILED" },
      })
      .catch(console.error);

    throw error;
  }
}
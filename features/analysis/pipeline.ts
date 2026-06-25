import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { generateEmbeddings } from "./utils/embeddings";
import { clusterReviews, determineK } from "./utils/clustering";
import {
  summarizeCluster,
  generateExecutiveSummary,
  computeSentimentBreakdown,
} from "./utils/summarization";

export interface PipelineOptions {
  requestId?: string;
}

export async function runAnalysisPipeline(
  sessionId: string,
  options: PipelineOptions = {}
): Promise<void> {
  const startTime = Date.now();
  const log = createLogger({
    sessionId,
    requestId: options.requestId,
    component: "pipeline",
  });

  log.info("Pipeline started");

  let totalOpenAiTokens = 0;

  try {
    const stageLoadStart = Date.now();
    const dbReviews = await prisma.review.findMany({
      where: { sessionId },
      select: { id: true, text: true, rating: true },
    });

    if (dbReviews.length === 0) {
      throw new Error("No reviews found in session");
    }

    log.stage("load_reviews", Date.now() - stageLoadStart, {
      reviewCount: dbReviews.length,
    });

    const embedStart = Date.now();
    const { reviews: embedded, totalTokens: embedTokens } =
      await generateEmbeddings(
        dbReviews.map((r) => ({ id: r.id, text: r.text })),
        log
      );
    totalOpenAiTokens += embedTokens;
    log.stage("embeddings", Date.now() - embedStart, {
      reviewCount: embedded.length,
      totalTokens: embedTokens,
    });

    const clusterStart = Date.now();
    const k = determineK(embedded.length);
    const clusters = clusterReviews(embedded, k);
    log.stage("clustering", Date.now() - clusterStart, {
      clusterCount: clusters.length,
      k,
    });

    const summarizeStart = Date.now();
    const themeResults = await Promise.all(
      clusters.map((cluster) =>
        summarizeCluster(cluster, embedded.length, log)
      )
    );
    const themes = themeResults.map((t) => t.theme);
    totalOpenAiTokens += themeResults.reduce(
      (sum, t) => sum + t.tokensUsed,
      0
    );
    log.stage("theme_summaries", Date.now() - summarizeStart, {
      themeCount: themes.length,
    });

    const ratings = dbReviews
      .map((r) => r.rating)
      .filter((r): r is number => r !== null && r !== undefined);

    const averageRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : undefined;

    const execStart = Date.now();
    const { summary: executiveSummary, tokensUsed: execTokens } =
      await generateExecutiveSummary(themes, embedded.length, averageRating, log);
    totalOpenAiTokens += execTokens;
    log.stage("executive_summary", Date.now() - execStart);

    const sentimentBreakdown = computeSentimentBreakdown(themes);
    const processingMs = Date.now() - startTime;

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
        log.warn("Result already exists — duplicate run, exiting cleanly");
        return;
      }
      throw createError;
    }

    await Promise.all(
      clusters.map((cluster) =>
        prisma.review.updateMany({
          where: { id: { in: cluster.reviewIds } },
          data: { clusterId: cluster.id },
        })
      )
    );

    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: "COMPLETED" },
    });

    log.info("Pipeline completed", {
      processingMs,
      totalOpenAiTokens,
      themeCount: themes.length,
      reviewCount: embedded.length,
    });
  } catch (error) {
    log.error("Pipeline failed", { error: String(error) });

    await prisma.analysisSession
      .updateMany({
        where: { id: sessionId, status: { not: "COMPLETED" } },
        data: { status: "FAILED" },
      })
      .catch((err: unknown) => {
        log.error("Failed to mark session FAILED", { error: String(err) });
      });

    throw error;
  }
}

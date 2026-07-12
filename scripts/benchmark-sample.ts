/**
 * Case study metrics for RL-014.
 *
 * Offline estimates (no API key):
 *   npx tsx scripts/benchmark-sample.ts --estimate-only
 *
 * Live pipeline timing + token usage:
 *   npx tsx --env-file=.env.local scripts/benchmark-sample.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import Papa from "papaparse";
import { estimatePipelineMs } from "@/lib/pipeline-estimate";
import { determineK } from "@/features/analysis/utils/clustering";

const EMBED_PRICE_PER_M = 0.02;
const GPT4O_MINI_INPUT_PER_M = 0.15;
const GPT4O_MINI_OUTPUT_PER_M = 0.6;
const THEME_PROMPT_OVERHEAD_TOKENS = 180;
const THEME_OUTPUT_TOKENS = 120;
const EXEC_PROMPT_OVERHEAD_TOKENS = 320;
const EXEC_OUTPUT_TOKENS = 200;
/** Upload + create session + poll jitter + dashboard SSR (production spot checks). */
const E2E_OVERHEAD_MS = 12_000;

interface CsvRow {
  review: string;
  rating?: string;
}

function loadSampleReviews(): { text: string; rating: number | null }[] {
  const csvPath = resolve(
    process.cwd(),
    "public/samples/product-reviews.csv"
  );
  const raw = readFileSync(csvPath, "utf8");
  const parsed = Papa.parse<CsvRow>(raw, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new Error(parsed.errors.map((e) => e.message).join("; "));
  }
  return parsed.data.map((row, index) => ({
    text: row.review?.trim() ?? "",
    rating: row.rating ? Number.parseInt(row.rating, 10) : null,
  })).filter((r) => r.text.length > 0);
}

function estimateCostUsd(
  embedTokens: number,
  chatPromptTokens: number,
  chatCompletionTokens: number
): number {
  const embedCost = (embedTokens / 1_000_000) * EMBED_PRICE_PER_M;
  const chatCost =
    (chatPromptTokens / 1_000_000) * GPT4O_MINI_INPUT_PER_M +
    (chatCompletionTokens / 1_000_000) * GPT4O_MINI_OUTPUT_PER_M;
  return embedCost + chatCost;
}

function estimateOfflineMetrics(reviews: { text: string }[]) {
  const reviewCount = reviews.length;
  const k = determineK(reviewCount);
  const totalChars = reviews.reduce((sum, r) => sum + r.text.length, 0);
  const embedTokens = Math.ceil(totalChars / 4);

  const themePromptTokens =
    k * (THEME_PROMPT_OVERHEAD_TOKENS + Math.ceil(totalChars / k / 4));
  const themeCompletionTokens = k * THEME_OUTPUT_TOKENS;
  const execPromptTokens = EXEC_PROMPT_OVERHEAD_TOKENS + k * 40;
  const execCompletionTokens = EXEC_OUTPUT_TOKENS;

  const chatPromptTokens = themePromptTokens + execPromptTokens;
  const chatCompletionTokens = themeCompletionTokens + execCompletionTokens;
  const totalTokens =
    embedTokens + chatPromptTokens + chatCompletionTokens;

  const processingMs = estimatePipelineMs(reviewCount);
  const p95UploadToDashboardMs = Math.round(processingMs * 1.35 + E2E_OVERHEAD_MS);

  return {
    sampleFile: "public/samples/product-reviews.csv",
    reviewCount,
    clusters: k,
    processingMs,
    p95UploadToDashboardMs,
    openAiTokens: {
      embeddings: embedTokens,
      chatPrompt: chatPromptTokens,
      chatCompletion: chatCompletionTokens,
      total: totalTokens,
    },
    estimatedCostUsd: Number(
      estimateCostUsd(embedTokens, chatPromptTokens, chatCompletionTokens).toFixed(
        5
      )
    ),
    mode: "estimate-only" as const,
  };
}

async function main() {
  const reviews = loadSampleReviews();
  const estimateOnly = process.argv.includes("--estimate-only");

  if (estimateOnly) {
    console.log(JSON.stringify(estimateOfflineMetrics(reviews), null, 2));
    return;
  }

  const { createLogger } = await import("@/lib/logger");
  const { generateEmbeddings } = await import(
    "@/features/analysis/utils/embeddings"
  );
  const { clusterReviews } = await import(
    "@/features/analysis/utils/clustering"
  );
  const { summarizeCluster, generateExecutiveSummary } = await import(
    "@/features/analysis/utils/summarization"
  );

  const log = createLogger({ component: "benchmark-sample" });
  const start = Date.now();

  const dbReviews = reviews.map((r, i) => ({
    id: `bench-${i}`,
    text: r.text,
  }));

  const { reviews: embedded, totalTokens: embedTokens } =
    await generateEmbeddings(dbReviews, log);

  const k = determineK(embedded.length);
  const clusters = clusterReviews(embedded, k);

  const themeResults = await Promise.all(
    clusters.map((cluster) =>
      summarizeCluster(cluster, embedded.length, log)
    )
  );

  const ratings = reviews
    .map((r) => r.rating)
    .filter((r): r is number => r !== null && !Number.isNaN(r));
  const averageRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : undefined;

  const { tokensUsed: execTokens } = await generateExecutiveSummary(
    themeResults.map((t) => t.theme),
    embedded.length,
    averageRating,
    log
  );

  const processingMs = Date.now() - start;
  const themeChatTokens = themeResults.reduce((sum, t) => sum + t.tokensUsed, 0);
  const totalTokens = embedTokens + themeChatTokens + execTokens;

  const chatPromptTokens = Math.round(totalTokens * 0.85) - embedTokens;
  const chatCompletionTokens = totalTokens - embedTokens - chatPromptTokens;

  const costUsd = estimateCostUsd(
    embedTokens,
    Math.max(0, chatPromptTokens),
    Math.max(0, chatCompletionTokens)
  );

  console.log(
    JSON.stringify(
      {
        sampleFile: "public/samples/product-reviews.csv",
        reviewCount: reviews.length,
        clusters: k,
        processingMs,
        p95UploadToDashboardMs: Math.round(processingMs * 1.15 + E2E_OVERHEAD_MS),
        openAiTokens: {
          embeddings: embedTokens,
          themeSummaries: themeChatTokens,
          executiveSummary: execTokens,
          total: totalTokens,
        },
        estimatedCostUsd: Number(costUsd.toFixed(5)),
        themes: themeResults.map((t) => t.theme.label),
        mode: "live" as const,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

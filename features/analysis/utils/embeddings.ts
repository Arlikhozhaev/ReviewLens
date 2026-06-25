import { openai } from "@/lib/openai";
import { OPENAI_MODELS, EMBEDDING_BATCH_SIZE } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import type { createLogger } from "@/lib/logger";
import type { EmbeddedReview } from "../types";

interface ReviewInput {
  id: string;
  text: string;
}

type Logger = ReturnType<typeof createLogger>;

const EMBEDDING_CONCURRENCY = 2;

async function embedBatch(
  batch: ReviewInput[],
  batchIdx: number,
  totalBatches: number,
  log: Logger
): Promise<{ embedded: EmbeddedReview[]; tokens: number }> {
  const texts = batch.map((r) => r.text.slice(0, 6_000));
  let attempt = 0;
  const maxAttempts = 3;

  while (attempt < maxAttempts) {
    try {
      const response = await openai.embeddings.create({
        model: OPENAI_MODELS.EMBEDDING,
        input: texts,
        encoding_format: "float",
      });

      const tokens = response.usage?.total_tokens ?? 0;
      log.openaiUsage("embeddings.batch", {
        total: tokens,
        prompt: response.usage?.prompt_tokens,
      }, { batch: batchIdx + 1, totalBatches });

      const embedded: EmbeddedReview[] = [];
      response.data.forEach((item, i) => {
        const review = batch[i];
        if (review) {
          embedded.push({
            id: review.id,
            text: review.text,
            embedding: item.embedding,
          });
        }
      });

      return { embedded, tokens };
    } catch (error: unknown) {
      attempt++;

      const isRateLimit =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status: number }).status === 429;

      if (isRateLimit || attempt < maxAttempts) {
        const waitMs = Math.pow(2, attempt) * 1_000;
        log.warn(`Embedding batch ${batchIdx + 1} retry`, {
          attempt,
          waitMs,
        });
        await sleep(waitMs);
      } else {
        throw new Error(
          `Embedding batch ${batchIdx + 1} failed after ${maxAttempts} attempts: ${String(error)}`
        );
      }
    }
  }

  return { embedded: [], tokens: 0 };
}

export async function generateEmbeddings(
  reviews: ReviewInput[],
  log: Logger
): Promise<{ reviews: EmbeddedReview[]; totalTokens: number }> {
  const batches: ReviewInput[][] = [];
  for (let i = 0; i < reviews.length; i += EMBEDDING_BATCH_SIZE) {
    batches.push(reviews.slice(i, i + EMBEDDING_BATCH_SIZE));
  }

  log.info("Generating embeddings", {
    reviewCount: reviews.length,
    batchCount: batches.length,
    concurrency: EMBEDDING_CONCURRENCY,
  });

  const results: EmbeddedReview[] = [];
  let totalTokens = 0;

  for (let i = 0; i < batches.length; i += EMBEDDING_CONCURRENCY) {
    const chunk = batches.slice(i, i + EMBEDDING_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((batch, j) => embedBatch(batch, i + j, batches.length, log))
    );

    for (const result of chunkResults) {
      results.push(...result.embedded);
      totalTokens += result.tokens;
    }

    if (i + EMBEDDING_CONCURRENCY < batches.length) {
      await sleep(150);
    }
  }

  return { reviews: results, totalTokens };
}

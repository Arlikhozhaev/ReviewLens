import { openai } from "@/lib/openai";
import { OPENAI_MODELS, EMBEDDING_BATCH_SIZE } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import type { EmbeddedReview } from "../types";

interface ReviewInput {
  id: string;
  text: string;
}

const EMBEDDING_CONCURRENCY = 2;

async function embedBatch(
  batch: ReviewInput[],
  batchIdx: number,
  totalBatches: number
): Promise<EmbeddedReview[]> {
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

      console.log(`[embeddings] Batch ${batchIdx + 1}/${totalBatches} done`);
      return embedded;
    } catch (error: unknown) {
      attempt++;

      const isRateLimit =
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        (error as { status: number }).status === 429;

      if (isRateLimit || attempt < maxAttempts) {
        const waitMs = Math.pow(2, attempt) * 1_000;
        console.warn(
          `[embeddings] Batch ${batchIdx + 1} attempt ${attempt} failed. Retrying in ${waitMs}ms`
        );
        await sleep(waitMs);
      } else {
        throw new Error(
          `Embedding batch ${batchIdx + 1} failed after ${maxAttempts} attempts: ${String(error)}`
        );
      }
    }
  }

  return [];
}

export async function generateEmbeddings(
  reviews: ReviewInput[]
): Promise<EmbeddedReview[]> {
  const batches: ReviewInput[][] = [];
  for (let i = 0; i < reviews.length; i += EMBEDDING_BATCH_SIZE) {
    batches.push(reviews.slice(i, i + EMBEDDING_BATCH_SIZE));
  }

  console.log(
    `[embeddings] ${reviews.length} reviews → ${batches.length} batches (concurrency ${EMBEDDING_CONCURRENCY})`
  );

  const results: EmbeddedReview[] = [];

  for (let i = 0; i < batches.length; i += EMBEDDING_CONCURRENCY) {
    const chunk = batches.slice(i, i + EMBEDDING_CONCURRENCY);
    const chunkResults = await Promise.all(
      chunk.map((batch, j) => embedBatch(batch, i + j, batches.length))
    );
    results.push(...chunkResults.flat());

    if (i + EMBEDDING_CONCURRENCY < batches.length) {
      await sleep(150);
    }
  }

  return results;
}

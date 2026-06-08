import { openai } from "@/lib/openai";
import { OPENAI_MODELS, EMBEDDING_BATCH_SIZE } from "@/lib/constants";
import { sleep } from "@/lib/utils";
import type { EmbeddedReview } from "../types";

interface ReviewInput {
  id: string;
  text: string;
}

export async function generateEmbeddings(
  reviews: ReviewInput[]
): Promise<EmbeddedReview[]> {
  const results: EmbeddedReview[] = [];

  // Split into batches of EMBEDDING_BATCH_SIZE (100)
  const batches: ReviewInput[][] = [];
  for (let i = 0; i < reviews.length; i += EMBEDDING_BATCH_SIZE) {
    batches.push(reviews.slice(i, i + EMBEDDING_BATCH_SIZE));
  }

  console.log(
    `[embeddings] ${reviews.length} reviews → ${batches.length} batches`
  );

  for (let batchIdx = 0; batchIdx < batches.length; batchIdx++) {
    const batch = batches[batchIdx];
    if (!batch) continue;

    const texts = batch.map((r) =>
      // Truncate to ~6000 chars — well within the token limit
      // Long reviews are truncated, not dropped
      r.text.slice(0, 6_000)
    );

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        const response = await openai.embeddings.create({
          model: OPENAI_MODELS.EMBEDDING,
          input: texts,
          encoding_format: "float",
        });

        // OpenAI returns embeddings in the same order as input
        response.data.forEach((item, i) => {
          const review = batch[i];
          if (review) {
            results.push({
              id: review.id,
              text: review.text,
              embedding: item.embedding,
            });
          }
        });

        console.log(
          `[embeddings] Batch ${batchIdx + 1}/${batches.length} done`
        );
        break; // success — exit retry loop

      } catch (error: unknown) {
        attempt++;

        // Rate limit — exponential backoff
        const isRateLimit =
          typeof error === "object" &&
          error !== null &&
          "status" in error &&
          (error as { status: number }).status === 429;

        if (isRateLimit || attempt < maxAttempts) {
          const waitMs = Math.pow(2, attempt) * 1_000;
          console.warn(
            `[embeddings] Attempt ${attempt} failed. Retrying in ${waitMs}ms`
          );
          await sleep(waitMs);
        } else {
          throw new Error(
            `Embedding batch ${batchIdx + 1} failed after ${maxAttempts} attempts: ${String(error)}`
          );
        }
      }
    }

    // Polite pause between batches
    if (batchIdx < batches.length - 1) {
      await sleep(200);
    }
  }

  return results;
}
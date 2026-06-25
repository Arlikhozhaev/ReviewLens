import OpenAI from "openai";
import { env } from "./env";

// Same singleton pattern as Prisma — prevents multiple client instances
// during hot reloads in development.
const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({
    apiKey: env.OPENAI_API_KEY,
    // Fail fast instead of the SDK's 10-minute default so a stalled request
    // can't hang the whole pipeline. The pipeline adds its own retries.
    timeout: 30_000,
    maxRetries: 2,
  });

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}
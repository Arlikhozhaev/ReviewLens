import OpenAI from "openai";
import { env } from "./env";

// Same singleton pattern as Prisma — prevents multiple client instances
// during hot reloads in development.
const globalForOpenAI = globalThis as unknown as {
  openai: OpenAI | undefined;
};

export const openai =
  globalForOpenAI.openai ??
  new OpenAI({ apiKey: env.OPENAI_API_KEY });

if (process.env.NODE_ENV !== "production") {
  globalForOpenAI.openai = openai;
}
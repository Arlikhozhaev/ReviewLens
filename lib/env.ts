import { z } from "zod";

const envSchema = z.object({
  // ── Database ─────────────────────────────────────────────────────────
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DIRECT_URL: z
    .string()
    .url("DIRECT_URL must be a valid connection URL")
    .optional(),

  // ── OpenAI ───────────────────────────────────────────────────────────
  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required")
    .startsWith("sk-", "OPENAI_API_KEY must start with sk-"),

  // ── App ──────────────────────────────────────────────────────────────
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "❌ Invalid environment variables:\n",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );
    throw new Error(
      "Invalid environment variables. Check your .env.local file."
    );
  }

  return parsed.data;
}

// Calling this at module scope means the error surfaces immediately,
// not buried in a request handler at an inconvenient time.
export const env = validateEnv();
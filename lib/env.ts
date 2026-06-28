import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid connection URL"),
  DIRECT_URL: z
    .string()
    .url("DIRECT_URL must be a valid connection URL")
    .optional(),

  OPENAI_API_KEY: z
    .string()
    .min(1, "OPENAI_API_KEY is required")
    .startsWith("sk-", "OPENAI_API_KEY must start with sk-"),

  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),

  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Auth — AUTH_SECRET required in production
  AUTH_SECRET: z.string().min(32).optional(),
  AUTH_URL: z.string().url().optional(),

  // Email magic links (Resend). Dev falls back to console logging.
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().min(3).optional(),
  /** Resend account email — required for onboarding@resend.dev sandbox sends. */
  RESEND_ACCOUNT_EMAIL: z.string().email().optional(),

  // Upstash Redis — optional; in-memory fallback in dev
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Inngest — optional; waitUntil fallback when unset
  INNGEST_EVENT_KEY: z.string().min(1).optional(),
  INNGEST_SIGNING_KEY: z.string().min(1).optional(),

  // Sentry — optional
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
});

type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error(
      "Invalid environment variables:\n",
      JSON.stringify(parsed.error.flatten().fieldErrors, null, 2)
    );
    throw new Error(
      "Invalid environment variables. Check your .env.local file."
    );
  }

  return parsed.data;
}

export const env = validateEnv();

export function getAuthSecret(): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  const isBuild = process.env.NEXT_PHASE === "phase-production-build";
  if (env.NODE_ENV === "production" && !isBuild) {
    throw new Error("AUTH_SECRET is required in production (min 32 characters).");
  }
  return "development-only-auth-secret-min-32-chars!!";
}

export function isUpstashConfigured(): boolean {
  return Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN);
}

export function isInngestConfigured(): boolean {
  return Boolean(env.INNGEST_EVENT_KEY);
}

export function isSentryConfigured(): boolean {
  return Boolean(env.SENTRY_DSN ?? env.NEXT_PUBLIC_SENTRY_DSN);
}

export function getEmailFrom(): string {
  return env.EMAIL_FROM ?? "ReviewLens <onboarding@resend.dev>";
}

import { createLogger } from "@/lib/logger";
import { prisma } from "@/lib/prisma";
import { isInngestConfigured, isUpstashConfigured, isSentryConfigured } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();
  const log = createLogger({ component: "health" });

  try {
    await prisma.$queryRaw`SELECT 1`;

    const payload = {
      status: "ok" as const,
      db: "connected" as const,
      latencyMs: Date.now() - started,
      timestamp: new Date().toISOString(),
      services: {
        upstash: isUpstashConfigured(),
        inngest: isInngestConfigured(),
        sentry: isSentryConfigured(),
      },
    };

    log.info("Health check ok", { latencyMs: payload.latencyMs });

    return Response.json(payload);
  } catch (error) {
    log.error("Health check failed", { error: String(error) });

    return Response.json(
      {
        status: "degraded" as const,
        db: "disconnected" as const,
        latencyMs: Date.now() - started,
        timestamp: new Date().toISOString(),
        services: {
          upstash: isUpstashConfigured(),
          inngest: isInngestConfigured(),
          sentry: isSentryConfigured(),
        },
      },
      { status: 503 }
    );
  }
}

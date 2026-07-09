import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STALE_MS, RATE_LIMITS } from "@/lib/constants";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponseHeaders,
} from "@/lib/rate-limit";
import { triggerAnalysisPipeline } from "@/lib/jobs/pipeline-trigger";
import { createLogger } from "@/lib/logger";
import {
  getRequestId,
  requireAuthUser,
  unauthorizedResponse,
} from "@/lib/auth-helpers";
import type { ApiResponse } from "@/types";

export const maxDuration = 60;

interface RouteContext {
  params: { id: string };
}

export async function POST(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<{ started: boolean; mode?: string }>>> {
  const requestId = getRequestId(request);
  const log = createLogger({ requestId, component: "process-route" });
  const { id: slug } = params;

  const ip = getClientIp(request);
  const limited = await checkRateLimit(
    `process:${ip}`,
    RATE_LIMITS.START_PIPELINE.limit,
    RATE_LIMITS.START_PIPELINE.windowMs
  );

  if (!limited.ok) {
    return NextResponse.json(
      {
        success: false as const,
        error: `Too many requests. Try again in ${limited.retryAfterSec}s.`,
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: rateLimitResponseHeaders(limited),
      }
    );
  }

  const authUser = await requireAuthUser();
  if (!authUser) {
    return unauthorizedResponse();
  }

  try {
    const session = await prisma.analysisSession.findUnique({
      where: { shareableSlug: slug },
      select: { id: true, userId: true, status: true, updatedAt: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false as const, error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (session.userId !== authUser.userId) {
      return NextResponse.json(
        { success: false as const, error: "Forbidden", code: "FORBIDDEN" },
        { status: 403 }
      );
    }

    if (session.status === "PROCESSING") {
      const staleThreshold = new Date(Date.now() - PIPELINE_STALE_MS);
      if (session.updatedAt < staleThreshold) {
        await prisma.analysisSession.updateMany({
          where: { id: session.id, status: "PROCESSING" },
          data: { status: "PENDING" },
        });
        log.warn("Recovered stale PROCESSING session", { sessionId: session.id });
      }
    }

    const claim = await prisma.analysisSession.updateMany({
      where: { id: session.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });

    if (claim.count === 0) {
      return NextResponse.json({
        success: true as const,
        data: { started: false },
      });
    }

    const mode = await triggerAnalysisPipeline({
      sessionId: session.id,
      requestId,
    });

    return NextResponse.json({
      success: true as const,
      data: { started: true, mode },
    });
  } catch (error) {
    log.error("Failed to start pipeline", { error: String(error) });
    return NextResponse.json(
      { success: false as const, error: "Failed to start pipeline" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { runAnalysisPipeline } from "@/features/analysis";
import { PIPELINE_STALE_MS, RATE_LIMITS } from "@/lib/constants";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types";

export const maxDuration = 60;

interface RouteContext {
  params: { id: string };
}

export async function POST(
  request: Request,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<{ started: boolean }>>> {
  const { id: slug } = params;

  const ip = getClientIp(request);
  const limited = rateLimit(
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
        headers: limited.retryAfterSec
          ? { "Retry-After": String(limited.retryAfterSec) }
          : undefined,
      }
    );
  }

  try {
    const session = await prisma.analysisSession.findUnique({
      where: { shareableSlug: slug },
      select: { id: true, status: true, updatedAt: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false as const, error: "Session not found" },
        { status: 404 }
      );
    }

    // Recover sessions stuck in PROCESSING (e.g. serverless function killed mid-run)
    if (session.status === "PROCESSING") {
      const staleThreshold = new Date(Date.now() - PIPELINE_STALE_MS);
      if (session.updatedAt < staleThreshold) {
        await prisma.analysisSession.updateMany({
          where: { id: session.id, status: "PROCESSING" },
          data: { status: "PENDING" },
        });
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

    const pipeline = runAnalysisPipeline(session.id).catch((error: unknown) => {
      console.error("[process route] Pipeline threw unhandled error:", error);
    });

    // Keep the pipeline alive after the HTTP response on Vercel serverless
    waitUntil(pipeline);

    return NextResponse.json({
      success: true as const,
      data: { started: true },
    });
  } catch (error) {
    console.error("[POST /api/analysis/[id]/process]", error);
    return NextResponse.json(
      { success: false as const, error: "Failed to start pipeline" },
      { status: 500 }
    );
  }
}

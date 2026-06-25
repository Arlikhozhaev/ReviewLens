import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyzeRequestSchema } from "@/lib/validations/review";
import { generateShareableSlug } from "@/lib/utils";
import { RATE_LIMITS } from "@/lib/constants";
import {
  checkRateLimit,
  getClientIp,
  rateLimitResponseHeaders,
} from "@/lib/rate-limit";
import {
  getRequestId,
  requireAuthUser,
  unauthorizedResponse,
} from "@/lib/auth-helpers";
import { getMembership } from "@/lib/org/access";
import { createLogger } from "@/lib/logger";
import type { ApiResponse } from "@/types";

export interface CreateAnalysisResponse {
  sessionId: string;
  shareableSlug: string;
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<CreateAnalysisResponse>>> {
  const requestId = getRequestId(request);
  const log = createLogger({ requestId, component: "create-analysis" });

  const authUser = await requireAuthUser();
  if (!authUser) {
    return unauthorizedResponse();
  }

  const ip = getClientIp(request);
  const rateKey = `create:${authUser.userId}:${ip}`;
  const limited = await checkRateLimit(
    rateKey,
    RATE_LIMITS.CREATE_ANALYSIS.limit,
    RATE_LIMITS.CREATE_ANALYSIS.windowMs
  );

  if (!limited.ok) {
    return NextResponse.json(
      {
        success: false as const,
        error: `Upload limit reached. Try again in ${limited.retryAfterSec}s.`,
        code: "RATE_LIMITED",
      },
      {
        status: 429,
        headers: rateLimitResponseHeaders(limited),
      }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = analyzeRequestSchema.safeParse(body);

    if (!parsed.success) {
      if (process.env.NODE_ENV === "development") {
        log.warn("Validation failed", {
          errors: parsed.error.flatten().fieldErrors,
        });
      }
      return NextResponse.json(
        {
          success: false as const,
          error: "Invalid request data",
          code: "VALIDATION_ERROR",
        },
        { status: 400 }
      );
    }

    const { reviews, sourceType, sourceUrl, fileName, organizationId } =
      parsed.data;

    if (organizationId) {
      const membership = await getMembership(authUser.userId, organizationId);
      if (!membership) {
        return NextResponse.json(
          {
            success: false as const,
            error: "You are not a member of that workspace",
            code: "FORBIDDEN",
          },
          { status: 403 }
        );
      }
    }

    const prismaSourceType =
      sourceType === "csv"
        ? "CSV"
        : sourceType === "paste"
          ? "PASTE"
          : "URL";

    const shareableSlug = generateShareableSlug();

    const session = await prisma.analysisSession.create({
      data: {
        shareableSlug,
        userId: authUser.userId,
        organizationId: organizationId ?? null,
        sourceType: prismaSourceType,
        sourceUrl: sourceUrl ?? null,
        fileName: fileName ?? null,
        status: "PENDING",
        totalReviews: reviews.length,
      },
    });

    await prisma.review.createMany({
      data: reviews.map((r) => ({
        sessionId: session.id,
        text: r.text,
        rating: r.rating ?? null,
        author: r.author ?? null,
        date: r.date ?? null,
      })),
    });

    log.info("Analysis session created", {
      sessionId: session.id,
      userId: authUser.userId,
      reviewCount: reviews.length,
    });

    return NextResponse.json({
      success: true as const,
      data: {
        sessionId: session.id,
        shareableSlug: session.shareableSlug,
      },
    });
  } catch (error) {
    log.error("Failed to create analysis session", { error: String(error) });
    return NextResponse.json(
      {
        success: false as const,
        error: "Failed to create analysis session.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}

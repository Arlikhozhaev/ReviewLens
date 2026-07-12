import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PIPELINE_STALE_MS } from "@/lib/constants";
import {
  checkShareAccess,
  shareAccessCookieName,
} from "@/lib/share-access";
import { isSessionCreator } from "@/lib/session-access";
import type { ApiResponse, SentimentBreakdown } from "@/types";
import type { ThemeAnalysis, StoredAnalysisResult } from "@/features/analysis/types";

export interface AnalysisStatusResponse {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalReviews: number;
  isStale?: boolean;
  result?: StoredAnalysisResult;
}

interface RouteContext {
  params: { id: string };
}

export async function GET(
  _req: Request,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<AnalysisStatusResponse>>> {
  const { id: slug } = params;

  try {
    const session = await prisma.analysisSession.findUnique({
      where: { shareableSlug: slug },
      select: {
        id: true,
        userId: true,
        status: true,
        totalReviews: true,
        updatedAt: true,
        sharePasswordHash: true,
        shareExpiresAt: true,
        result: {
          select: {
            executiveSummary: true,
            sentimentData: true,
            themesData: true,
            averageRating: true,
            processingMs: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { success: false as const, error: "Forbidden" },
        { status: 403 }
      );
    }

    const authUser = await auth();
    const userId = authUser?.user?.id;
    const isCreator = isSessionCreator(userId, session);

    if (!isCreator) {
      const cookieToken = cookies().get(
        shareAccessCookieName(session.id)
      )?.value;
      const shareAccess = checkShareAccess(session, cookieToken);
      if (!shareAccess.allowed) {
        return NextResponse.json(
          { success: false as const, error: shareAccess.error },
          { status: shareAccess.status }
        );
      }
    }

    const staleThreshold = new Date(Date.now() - PIPELINE_STALE_MS);
    const isStale =
      session.status === "PROCESSING" && session.updatedAt < staleThreshold;

    const payload: AnalysisStatusResponse = {
      status: session.status,
      totalReviews: session.totalReviews,
      isStale,
    };

    if (session.status === "COMPLETED" && session.result) {
      payload.result = {
        executiveSummary: session.result.executiveSummary,
        sentimentBreakdown:
          session.result.sentimentData as unknown as SentimentBreakdown,
        themes: session.result.themesData as unknown as ThemeAnalysis[],
        averageRating: session.result.averageRating ?? undefined,
        processingMs: session.result.processingMs ?? 0,
      };
    }

    return NextResponse.json({ success: true as const, data: payload });
  } catch (error) {
    console.error("[GET /api/analysis/[id]/status]", error);
    return NextResponse.json(
      { success: false as const, error: "Failed to fetch status" },
      { status: 500 }
    );
  }
}

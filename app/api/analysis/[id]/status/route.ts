import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse, SentimentBreakdown } from "@/types";
import type { ThemeAnalysis } from "@/features/analysis/types";

export interface AnalysisStatusResponse {
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  totalReviews: number;
  result?: {
    executiveSummary: string;
    sentimentBreakdown: SentimentBreakdown;
    themes: ThemeAnalysis[];
    averageRating?: number;
    processingMs: number;
  };
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
        status: true,
        totalReviews: true,
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
        { success: false as const, error: "Session not found" },
        { status: 404 }
      );
    }

    const payload: AnalysisStatusResponse = {
      status: session.status,
      totalReviews: session.totalReviews,
    };

    if (session.status === "COMPLETED" && session.result) {
      payload.result = {
        executiveSummary: session.result.executiveSummary,
        sentimentBreakdown: session.result.sentimentData as unknown as SentimentBreakdown,
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
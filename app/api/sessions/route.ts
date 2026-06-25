import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { ApiResponse } from "@/types";
import type { SessionCardData } from "@/features/sessions";

export interface SessionsListResponse {
  sessions: SessionCardData[];
}

const MAX_SLUGS = 50;

export async function GET(
  request: Request
): Promise<NextResponse<ApiResponse<SessionsListResponse>>> {
  const { searchParams } = new URL(request.url);
  const slugsParam = searchParams.get("slugs");

  if (!slugsParam) {
    return NextResponse.json({
      success: true as const,
      data: { sessions: [] },
    });
  }

  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX_SLUGS);

  if (slugs.length === 0) {
    return NextResponse.json({
      success: true as const,
      data: { sessions: [] },
    });
  }

  try {
    const raw = await prisma.analysisSession.findMany({
      where: { shareableSlug: { in: slugs } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        shareableSlug: true,
        status: true,
        totalReviews: true,
        fileName: true,
        sourceType: true,
        createdAt: true,
        result: { select: { averageRating: true } },
      },
    });

    const slugOrder = new Map(slugs.map((slug, i) => [slug, i]));
    const sessions: SessionCardData[] = raw
      .map((s) => ({
        id: s.id,
        shareableSlug: s.shareableSlug,
        status: s.status,
        totalReviews: s.totalReviews,
        fileName: s.fileName,
        sourceType: s.sourceType,
        createdAt: s.createdAt.toISOString(),
        averageRating: s.result?.averageRating ?? null,
      }))
      .sort(
        (a, b) =>
          (slugOrder.get(a.shareableSlug) ?? 999) -
          (slugOrder.get(b.shareableSlug) ?? 999)
      );

    return NextResponse.json({
      success: true as const,
      data: { sessions },
    });
  } catch (error) {
    console.error("[GET /api/sessions]", error);
    return NextResponse.json(
      { success: false as const, error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}

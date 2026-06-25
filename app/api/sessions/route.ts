import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  requireAuthUser,
  unauthorizedResponse,
} from "@/lib/auth-helpers";
import { createLogger } from "@/lib/logger";
import { getMembership } from "@/lib/org/access";
import type { ApiResponse } from "@/types";
import type { SessionCardData } from "@/features/sessions";

export interface SessionsListResponse {
  sessions: SessionCardData[];
}

const MAX_SESSIONS = 100;

export async function GET(request: Request): Promise<
  NextResponse<ApiResponse<SessionsListResponse>>
> {
  const authUser = await requireAuthUser();
  if (!authUser) {
    return unauthorizedResponse();
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? "personal";

  const log = createLogger({
    userId: authUser.userId,
    component: "sessions-api",
  });

  try {
    let where: { userId?: string; organizationId?: string | null } = {
      userId: authUser.userId,
      organizationId: null,
    };

    if (scope !== "personal") {
      const org = await prisma.organization.findUnique({
        where: { slug: scope },
        select: { id: true },
      });
      if (!org) {
        return NextResponse.json(
          { success: false as const, error: "Workspace not found" },
          { status: 404 }
        );
      }
      const membership = await getMembership(authUser.userId, org.id);
      if (!membership) {
        return NextResponse.json(
          { success: false as const, error: "Forbidden" },
          { status: 403 }
        );
      }
      where = { organizationId: org.id };
    }

    const raw = await prisma.analysisSession.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: MAX_SESSIONS,
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

    const sessions: SessionCardData[] = raw.map((s) => ({
      id: s.id,
      shareableSlug: s.shareableSlug,
      status: s.status,
      totalReviews: s.totalReviews,
      fileName: s.fileName,
      sourceType: s.sourceType,
      createdAt: s.createdAt.toISOString(),
      averageRating: s.result?.averageRating ?? null,
    }));

    log.info("Sessions listed", { count: sessions.length });

    return NextResponse.json({
      success: true as const,
      data: { sessions },
    });
  } catch (error) {
    log.error("Failed to load sessions", { error: String(error) });
    return NextResponse.json(
      { success: false as const, error: "Failed to load sessions" },
      { status: 500 }
    );
  }
}

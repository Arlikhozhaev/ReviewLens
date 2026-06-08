import { NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { prisma } from "@/lib/prisma";
import { runAnalysisPipeline } from "@/features/analysis";
import type { ApiResponse } from "@/types";

interface RouteContext {
  params: { id: string };
}

export async function POST(
  _req: Request,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<{ started: boolean }>>> {
  const { id: slug } = params;

  try {
    const session = await prisma.analysisSession.findUnique({
      where: { shareableSlug: slug },
      select: { id: true, status: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false as const, error: "Session not found" },
        { status: 404 }
      );
    }

    // Idempotent — if already processing or done, don't start again
    if (session.status !== "PENDING") {
      return NextResponse.json({
        success: true as const,
        data: { started: false },
      });
    }

    // waitUntil keeps the serverless function alive after the response is sent.
    // The pipeline runs in the background while the client polls /status.
    // On local dev this behaves like a normal async call.
    waitUntil(
      runAnalysisPipeline(session.id).catch(console.error)
    );

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
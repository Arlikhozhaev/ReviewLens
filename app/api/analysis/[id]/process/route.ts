import { NextResponse } from "next/server";
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
      select: { id: true },
    });

    if (!session) {
      return NextResponse.json(
        { success: false as const, error: "Session not found" },
        { status: 404 }
      );
    }

    // Atomic claim. The WHERE clause includes status: "PENDING", so Postgres
    // serializes concurrent updateMany calls against this row — exactly one
    // request can match "PENDING" and flip it to "PROCESSING". Every other
    // concurrent call (e.g. React Strict Mode's double effect invocation in
    // dev, or a duplicate request in prod) sees count: 0 and backs off
    // instead of starting a second pipeline run. This replaces a read-then-
    // write check, which has a race window between the read and the write.
    const claim = await prisma.analysisSession.updateMany({
      where: { id: session.id, status: "PENDING" },
      data: { status: "PROCESSING" },
    });

    if (claim.count === 0) {
      // Already claimed by another request, or already done — don't duplicate
      return NextResponse.json({
        success: true as const,
        data: { started: false },
      });
    }

    runAnalysisPipeline(session.id).catch((error: unknown) => {
      console.error("[process route] Pipeline threw unhandled error:", error);
    });

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
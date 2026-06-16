import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runAnalysisPipeline } from "@/features/analysis";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  // Only usable in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  const { id: slug } = params;

  const session = await prisma.analysisSession.findUnique({
    where: { shareableSlug: slug },
    select: { id: true, status: true },
  });

  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Force reset to PENDING so pipeline can re-run
  await prisma.analysisSession.update({
    where: { id: session.id },
    data: { status: "PENDING" },
  });

  // Also delete any existing result so pipeline can write a fresh one
  await prisma.analysisResult.deleteMany({
    where: { sessionId: session.id },
  });

  try {
    await runAnalysisPipeline(session.id);
    return NextResponse.json({ success: true, sessionId: session.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    return NextResponse.json({ success: false, error: message, stack }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth-helpers";
import { runAnalysisPipeline } from "@/features/analysis";

function notFound() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  if (process.env.NODE_ENV !== "development") {
    return notFound();
  }

  const authUser = await requireAuthUser();
  if (!authUser) {
    return notFound();
  }

  const { id: slug } = params;

  const session = await prisma.analysisSession.findUnique({
    where: { shareableSlug: slug },
    select: { id: true, userId: true, status: true },
  });

  if (!session) {
    return notFound();
  }

  if (session.userId !== authUser.userId) {
    return notFound();
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

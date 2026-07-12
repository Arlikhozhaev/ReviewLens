import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  isShareExpired,
  shareAccessCookieName,
  verifyShareAccessToken,
} from "@/lib/share-access";
import { isSessionCreator } from "@/lib/session-access";

interface RouteContext {
  params: { id: string };
}

type Cell = string | number | null | undefined;

function escapeCsv(value: Cell): string {
  const s = value === undefined || value === null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Cell[][]): string {
  return rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n");
}

export async function GET(_req: Request, { params }: RouteContext) {
  const slug = params.id;

  const session = await prisma.analysisSession.findUnique({
    where: { shareableSlug: slug },
    select: {
      id: true,
      userId: true,
      fileName: true,
      sharePasswordHash: true,
      shareExpiresAt: true,
      reviews: {
        select: {
          text: true,
          rating: true,
          author: true,
          date: true,
          sentiment: true,
          clusterId: true,
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      { success: false as const, error: "Analysis not found" },
      { status: 404 }
    );
  }

  // Same access rules as the dashboard view.
  const authUser = await auth();
  const userId = authUser?.user?.id;
  const isCreator = isSessionCreator(userId, session);

  if (!isCreator) {
    if (isShareExpired(session.shareExpiresAt)) {
      return NextResponse.json(
        { success: false as const, error: "This link has expired." },
        { status: 410 }
      );
    }
    if (session.sharePasswordHash) {
      const token = cookies().get(shareAccessCookieName(session.id))?.value;
      if (!verifyShareAccessToken(token, session.id)) {
        return NextResponse.json(
          { success: false as const, error: "Password required" },
          { status: 401 }
        );
      }
    }
  }

  const header: Cell[] = [
    "review",
    "rating",
    "author",
    "date",
    "sentiment",
    "cluster",
  ];
  const rows: Cell[][] = session.reviews.map((r) => [
    r.text,
    r.rating,
    r.author,
    r.date,
    r.sentiment,
    r.clusterId,
  ]);

  const csv = "\uFEFF" + toCsv([header, ...rows]);
  const base =
    session.fileName?.replace(/\.[^.]+$/, "").trim() || "reviewlens-reviews";

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${base}-reviews.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

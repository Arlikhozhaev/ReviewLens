import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import {
  isShareExpired,
  shareAccessCookieName,
  verifyShareAccessToken,
} from "@/lib/share-access";
import { DashboardClient } from "./dashboard-client";
import { ShareGate, ShareExpired } from "./share-gate";
import type { StoredAnalysisResult, ThemeAnalysis } from "@/features/analysis/types";
import type { SentimentBreakdown } from "@/types";
import {
  isSessionCreator,
} from "@/lib/session-access";

interface Props {
  params: { id: string };
}

// generateMetadata runs server-side and populates <head> for every request.
// This is what makes the shareable link actually work as a social preview.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const session = await prisma.analysisSession.findUnique({
    where: { shareableSlug: params.id },
    select: { totalReviews: true, fileName: true, sourceType: true },
  });

  if (!session) return { title: "Analysis not found" };

  const name =
    session.fileName ??
    (session.sourceType === "URL" ? "URL" : "CSV");

  const title = `${name} — Analysis Results`;
  const description = `AI-powered insights from ${session.totalReviews} customer reviews`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function DashboardPage({ params }: Props) {
  const session = await prisma.analysisSession.findUnique({
    where: { shareableSlug: params.id },
    select: {
      id: true,
      userId: true,
      status: true,
      totalReviews: true,
      fileName: true,
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

  if (!session) notFound();

  // Owner (the analysis creator) always has full access, bypassing
  // expiry and password gates set for shared viewers.
  const authUser = await auth();
  const userId = authUser?.user?.id;
  const isCreator = isSessionCreator(userId, session);
  const isOwner = isCreator;

  if (!isCreator) {
    if (isShareExpired(session.shareExpiresAt)) {
      return <ShareExpired />;
    }

    if (session.sharePasswordHash) {
      const cookieStore = cookies();
      const token = cookieStore.get(
        shareAccessCookieName(session.id)
      )?.value;

      if (!verifyShareAccessToken(token, session.id)) {
        return <ShareGate slug={params.id} />;
      }
    }
  }

  // Shape Prisma's Json columns into our typed result interface
  const initialResult: StoredAnalysisResult | null = session.result
    ? {
        executiveSummary: session.result.executiveSummary,
        sentimentBreakdown:
          session.result.sentimentData as unknown as SentimentBreakdown,
        themes: session.result.themesData as unknown as ThemeAnalysis[],
        averageRating: session.result.averageRating ?? undefined,
        processingMs: session.result.processingMs ?? 0,
      }
    : null;

  return (
    <DashboardClient
      slug={params.id}
      sessionId={session.id}
      fileName={session.fileName}
      isOwner={isOwner}
      hasSharePassword={Boolean(session.sharePasswordHash)}
      shareExpiresAt={session.shareExpiresAt?.toISOString() ?? null}
      initialStatus={session.status}
      initialTotalReviews={session.totalReviews}
      initialResult={initialResult}
    />
  );
}

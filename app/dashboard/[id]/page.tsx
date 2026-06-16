import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboard-client";
import type { StoredAnalysisResult } from "@/features/analysis/types";
import type { SentimentBreakdown } from "@/types";
import type { ThemeAnalysis } from "@/features/analysis/types";

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

  if (!session) notFound();

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
      initialStatus={session.status}
      initialTotalReviews={session.totalReviews}
      initialResult={initialResult}
    />
  );
}
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  compareAnalyses,
  type AnalysisSnapshot,
  type AnalysisComparison,
} from "@/lib/compare/diff";
import type { SentimentBreakdown } from "@/types";
import type { ThemeAnalysis } from "@/features/analysis/types";
import { CompareClient, type CompareOption } from "./compare-client";

export const metadata: Metadata = {
  title: "Compare analyses",
  description: "Track how themes and sentiment shift across your analyses",
};

interface Props {
  searchParams: { from?: string; to?: string };
}

async function loadSnapshot(
  userId: string,
  slug: string
): Promise<AnalysisSnapshot | null> {
  const session = await prisma.analysisSession.findFirst({
    where: { shareableSlug: slug, userId, status: "COMPLETED" },
    select: {
      shareableSlug: true,
      fileName: true,
      createdAt: true,
      totalReviews: true,
      result: {
        select: {
          sentimentData: true,
          themesData: true,
          averageRating: true,
        },
      },
    },
  });

  if (!session?.result) return null;

  return {
    slug: session.shareableSlug,
    label: session.fileName ?? "Untitled analysis",
    createdAt: session.createdAt.toISOString(),
    totalReviews: session.totalReviews,
    averageRating: session.result.averageRating ?? undefined,
    sentimentBreakdown:
      session.result.sentimentData as unknown as SentimentBreakdown,
    themes: session.result.themesData as unknown as ThemeAnalysis[],
  };
}

export default async function ComparePage({ searchParams }: Props) {
  const authUser = await auth();
  if (!authUser?.user?.id) {
    redirect("/login?callbackUrl=/compare");
  }
  const userId = authUser.user.id;

  const analyses = await prisma.analysisSession.findMany({
    where: { userId, status: "COMPLETED" },
    orderBy: { createdAt: "desc" },
    select: {
      shareableSlug: true,
      fileName: true,
      createdAt: true,
      totalReviews: true,
    },
  });

  const options: CompareOption[] = analyses.map((a) => ({
    slug: a.shareableSlug,
    label: a.fileName ?? "Untitled analysis",
    createdAt: a.createdAt.toISOString(),
    totalReviews: a.totalReviews,
  }));

  const { from, to } = searchParams;
  let comparison: AnalysisComparison | null = null;

  if (from && to && from !== to) {
    const [previous, current] = await Promise.all([
      loadSnapshot(userId, from),
      loadSnapshot(userId, to),
    ]);
    if (previous && current) {
      comparison = compareAnalyses(previous, current);
    }
  }

  return (
    <CompareClient
      options={options}
      from={from ?? null}
      to={to ?? null}
      comparison={comparison}
    />
  );
}

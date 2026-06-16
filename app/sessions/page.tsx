import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { prisma } from "@/lib/prisma";
import { formatNumber } from "@/lib/utils";
import { SessionsList } from "./sessions-list";
import type { SessionCardData } from "@/features/sessions";

export const metadata: Metadata = {
  title: "Sessions",
  description: "Your past ReviewLens analyses",
};

// Revalidate every 30s so in-progress analyses eventually show COMPLETED
export const revalidate = 30;

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}

export default async function SessionsPage() {
  const raw = await prisma.analysisSession.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      shareableSlug: true,
      status: true,
      totalReviews: true,
      fileName: true,
      sourceType: true,
      createdAt: true,
    },
  });

  // Dates must be serialized to strings before passing to client components.
  // Next.js cannot serialize Date objects across the server→client boundary.
  const sessions: SessionCardData[] = raw.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
  }));

  const completedCount = sessions.filter(
    (s) => s.status === "COMPLETED"
  ).length;

  const totalReviews = sessions.reduce((sum, s) => sum + s.totalReviews, 0);

  const thisWeekCount = sessions.filter((s) => {
    const ageMs = Date.now() - new Date(s.createdAt).getTime();
    return ageMs < 7 * 24 * 60 * 60 * 1_000;
  }).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="container max-w-3xl space-y-6 py-10">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Sessions</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {sessions.length === 0
                ? "No analyses yet"
                : `${sessions.length} total · ${completedCount} completed`}
            </p>
          </div>
          <Button size="sm" asChild className="gap-1.5">
            <Link href="/analyze">
              <Plus className="h-3.5 w-3.5" aria-hidden />
              New analysis
            </Link>
          </Button>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Total analyses"
                value={formatNumber(sessions.length)}
              />
              <StatCard
                label="Reviews processed"
                value={formatNumber(totalReviews)}
              />
              <StatCard
                label="This week"
                value={formatNumber(thisWeekCount)}
              />
            </div>
            <Separator />
          </>
        )}

        {/* ── List ────────────────────────────────────────────────────── */}
        <SessionsList initialSessions={sessions} />
      </main>
    </div>
  );
}
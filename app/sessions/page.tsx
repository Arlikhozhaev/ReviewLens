import type { Metadata } from "next";
import Link from "next/link";
import { Plus, BarChart3, MessageSquare, CalendarRange, FolderArchive } from "lucide-react";
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

function StatCard({ 
  label, 
  value, 
  icon, 
  description 
}: { 
  label: string; 
  value: string; 
  icon: React.ReactNode; 
  description?: string 
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/50 p-5 shadow-xs transition-all duration-300 hover:scale-[1.01] hover:shadow-md hover:border-primary/20 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">{label}</p>
        <span className="text-primary/70">{icon}</span>
      </div>
      <p className="mt-2.5 text-3xl font-extrabold tracking-tight tabular-nums text-foreground">{value}</p>
      {description && <p className="mt-1 text-[10px] text-muted-foreground/80">{description}</p>}
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
      result: {
        select: {
          averageRating: true,
        }
      }
    },
  });

  // Dates must be serialized to strings before passing to client components.
  // Next.js cannot serialize Date objects across the server→client boundary.
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

  const completedCount = sessions.filter(
    (s) => s.status === "COMPLETED"
  ).length;

  const totalReviews = sessions.reduce((sum, s) => sum + s.totalReviews, 0);

  const thisWeekCount = sessions.filter((s) => {
    const ageMs = Date.now() - new Date(s.createdAt).getTime();
    return ageMs < 7 * 24 * 60 * 60 * 1_000;
  }).length;

  return (
    <div className="flex min-h-screen flex-col relative overflow-hidden bg-background">
      {/* Background Mesh matching marketing page */}
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <Navbar />

      <main className="container max-w-5xl relative space-y-8 py-10 px-4">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-wrap items-center justify-between gap-4 animate-fade-up">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <FolderArchive className="h-3 w-3" />
              Analysis History
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Saved <span className="text-gradient">Sessions</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {sessions.length === 0
                ? "No analyses run yet"
                : `${sessions.length} total run · ${completedCount} completed successfully`}
            </p>
          </div>
          <Button size="default" asChild className="gap-2 shadow-md transition-transform duration-150 hover:scale-[1.02]">
            <Link href="/analyze">
              <Plus className="h-4 w-4" aria-hidden />
              New analysis
            </Link>
          </Button>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────── */}
        {sessions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
            <StatCard
              label="Total analyses"
              value={formatNumber(sessions.length)}
              icon={<BarChart3 className="h-5 w-5" />}
              description="CSV uploads and link crawls"
            />
            <StatCard
              label="Reviews processed"
              value={formatNumber(totalReviews)}
              icon={<MessageSquare className="h-5 w-5" />}
              description="Summaries and theme mappings"
            />
            <StatCard
              label="This week"
              value={formatNumber(thisWeekCount)}
              icon={<CalendarRange className="h-5 w-5" />}
              description="Last 7 days of activity"
            />
          </div>
        )}

        <Separator className="border-border/60 animate-fade-up" style={{ animationDelay: "150ms" }} />

        {/* ── List ────────────────────────────────────────────────────── */}
        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          <SessionsList initialSessions={sessions} />
        </div>
      </main>
    </div>
  );
}
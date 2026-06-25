"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, BarChart3, MessageSquare, CalendarRange, FolderArchive, GitCompareArrows } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionCard } from "@/features/sessions";
import { deleteSession } from "@/lib/actions/sessions";
import { apiFetch, ApiError } from "@/lib/api";
import { formatNumber } from "@/lib/utils";
import type { SessionCardData } from "@/features/sessions";
import type { SessionsListResponse } from "@/app/api/sessions/route";

function StatCard({
  label,
  value,
  icon,
  description,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  description?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/50 p-5 shadow-xs backdrop-blur-md transition-all duration-300 hover:scale-[1.01] hover:border-primary/20 hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
          {label}
        </p>
        <span className="text-primary/70">{icon}</span>
      </div>
      <p className="mt-2.5 text-3xl font-extrabold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      {description && (
        <p className="mt-1 text-[10px] text-muted-foreground/80">{description}</p>
      )}
    </div>
  );
}

export function SessionsPageClient() {
  const [sessions, setSessions] = useState<SessionCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSessions = useCallback(async () => {
    try {
      const data = await apiFetch<SessionsListResponse>("/api/sessions");
      setSessions(data.sessions);
    } catch (err) {
      if (err instanceof ApiError && err.statusCode === 401) {
        window.location.href = "/login?callbackUrl=/sessions";
        return;
      }
      toast.error("Could not load your sessions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function handleDelete(sessionId: string) {
    const previous = sessions;
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    const result = await deleteSession(sessionId);

    if (result.error) {
      setSessions(previous);
      toast.error(result.error);
    } else {
      toast.success("Session deleted");
    }
  }

  const completedCount = sessions.filter((s) => s.status === "COMPLETED").length;
  const totalReviews = sessions.reduce((sum, s) => sum + s.totalReviews, 0);
  const thisWeekCount = sessions.filter((s) => {
    const ageMs = Date.now() - new Date(s.createdAt).getTime();
    return ageMs < 7 * 24 * 60 * 60 * 1_000;
  }).length;

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <Navbar />

      <main className="container relative max-w-5xl space-y-8 px-4 py-10">
        <div className="animate-fade-up flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
              <FolderArchive className="h-3 w-3" />
              Analysis History
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
              Your <span className="text-gradient">Sessions</span>
            </h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading…"
                : sessions.length === 0
                  ? "Your analyses appear here after you sign in and upload"
                  : `${sessions.length} analyses · ${completedCount} completed`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {completedCount >= 2 && (
              <Button
                size="default"
                variant="outline"
                asChild
                className="gap-2 transition-transform duration-150 hover:scale-[1.02]"
              >
                <Link href="/compare">
                  <GitCompareArrows className="h-4 w-4" aria-hidden />
                  Compare
                </Link>
              </Button>
            )}
            <Button
              size="default"
              asChild
              className="gap-2 shadow-md transition-transform duration-150 hover:scale-[1.02]"
            >
              <Link href="/analyze">
                <Plus className="h-4 w-4" aria-hidden />
                New analysis
              </Link>
            </Button>
          </div>
        </div>

        {!loading && sessions.length > 0 && (
          <div
            className="animate-fade-up grid grid-cols-1 gap-4 sm:grid-cols-3"
            style={{ animationDelay: "100ms" }}
          >
            <StatCard
              label="Total analyses"
              value={formatNumber(sessions.length)}
              icon={<BarChart3 className="h-5 w-5" />}
              description="Linked to your account"
            />
            <StatCard
              label="Reviews processed"
              value={formatNumber(totalReviews)}
              icon={<MessageSquare className="h-5 w-5" />}
              description="Across your sessions"
            />
            <StatCard
              label="This week"
              value={formatNumber(thisWeekCount)}
              icon={<CalendarRange className="h-5 w-5" />}
              description="Last 7 days"
            />
          </div>
        )}

        <Separator className="animate-fade-up border-border/60" style={{ animationDelay: "150ms" }} />

        <div className="animate-fade-up" style={{ animationDelay: "200ms" }}>
          {loading ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Loading your sessions…
            </div>
          ) : sessions.length === 0 ? (
            <EmptyState
              icon={BarChart3}
              title="No analyses yet"
              description="Sign in and upload a CSV to run your first analysis. Reports stay linked to your account and remain shareable via link."
              action={
                <Button size="sm" asChild className="shadow-md">
                  <Link href="/analyze">
                    <Plus className="mr-1.5 h-4 w-4" />
                    New analysis
                  </Link>
                </Button>
              }
              className="rounded-2xl border border-border/80 bg-card/45 py-20 shadow-sm backdrop-blur-md"
            />
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {sessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onDelete={(id) => handleDelete(id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

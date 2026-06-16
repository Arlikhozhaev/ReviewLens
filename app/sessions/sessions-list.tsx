"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BarChart3, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { SessionCard } from "@/features/sessions";
import { deleteSession } from "@/lib/actions/sessions";
import type { SessionCardData } from "@/features/sessions";

export function SessionsList({
  initialSessions,
}: {
  initialSessions: SessionCardData[];
}) {
  // Local state drives the list — optimistic updates remove cards instantly.
  // On error we restore the original list from the prop (closed over in the
  // handler) so the user always sees consistent state.
  const [sessions, setSessions] = useState(initialSessions);

  async function handleDelete(sessionId: string) {
    const previous = sessions;

    // Optimistic — remove immediately
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));

    const result = await deleteSession(sessionId);

    if (result.error) {
      // Rollback
      setSessions(previous);
      toast.error("Couldn't delete session. Please try again.");
    } else {
      toast.success("Session deleted");
    }
  }

  if (sessions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analyses yet"
        description="Upload a CSV or paste a product URL to run your first analysis."
        action={
          <Button size="sm" asChild>
            <Link href="/analyze">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              New analysis
            </Link>
          </Button>
        }
        className="py-20"
      />
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((session) => (
        <SessionCard
          key={session.id}
          session={session}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
}
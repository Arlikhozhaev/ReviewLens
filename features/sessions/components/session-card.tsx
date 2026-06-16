"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Globe, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";

export type SessionCardData = {
  id: string;
  shareableSlug: string;
  status: string;
  totalReviews: number;
  fileName: string | null;
  sourceType: string;
  createdAt: string; // ISO string — Date is not serializable across server→client boundary
};

interface SessionCardProps {
  session: SessionCardData;
  onDelete: (id: string) => Promise<void>;
}

type StatusConfig = { label: string; className: string; animated?: boolean };

const STATUS_CONFIG: Record<string, StatusConfig> = {
  COMPLETED: {
    label: "Completed",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400",
  },
  FAILED: {
    label: "Failed",
    className:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400",
  },
  PROCESSING: {
    label: "Processing",
    className:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400",
    animated: true,
  },
  PENDING: {
    label: "Pending",
    className:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-400",
  },
};

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);

  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function SessionCard({ session, onDelete }: SessionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmTimer, setConfirmTimer] = useState<NodeJS.Timeout | null>(null);

  const config = STATUS_CONFIG[session.status] ?? {
    label: session.status,
    className: "border-border bg-muted text-muted-foreground",
  };

  const displayName =
    session.fileName ??
    (session.sourceType === "URL" ? "URL Analysis" : "CSV Analysis");

  const isViewable = ["COMPLETED", "PROCESSING", "PENDING"].includes(
    session.status
  );

  function handleDeleteClick() {
    if (!confirmDelete) {
      // First click — arm the confirm state, auto-disarm after 3s
      setConfirmDelete(true);
      const t = setTimeout(() => setConfirmDelete(false), 3_000);
      setConfirmTimer(t);
    } else {
      // Second click — execute
      if (confirmTimer) clearTimeout(confirmTimer);
      setConfirmDelete(false);
      setIsDeleting(true);
      void onDelete(session.id);
    }
  }

  return (
    <div
      className={cn(
        "group flex items-center gap-4 rounded-xl border border-border bg-card p-4",
        "transition-all duration-150 hover:border-border/60 hover:shadow-sm",
        isDeleting && "pointer-events-none opacity-40"
      )}
    >
      {/* Source type icon */}
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-muted">
        {session.sourceType === "URL" ? (
          <Globe className="h-4 w-4 text-muted-foreground" aria-hidden />
        ) : (
          <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
      </div>

      {/* Info block */}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{displayName}</p>

          {/* Status badge */}
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
              config.className
            )}
          >
            {config.animated && (
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-current"
                aria-hidden
              />
            )}
            {config.label}
          </span>
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatNumber(session.totalReviews)} reviews ·{" "}
          {session.sourceType} ·{" "}
          {formatRelativeTime(session.createdAt)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        {isViewable && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-2.5 text-xs"
            asChild
          >
            <Link href={`/dashboard/${session.shareableSlug}`}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              View
            </Link>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 w-8 p-0 transition-colors",
            confirmDelete
              ? "border border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              : "text-muted-foreground hover:text-destructive"
          )}
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label={confirmDelete ? "Confirm delete" : "Delete session"}
          title={confirmDelete ? "Click again to confirm" : "Delete"}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
    </div>
  );
}
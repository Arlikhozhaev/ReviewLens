"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Globe, ClipboardPaste, Trash2, ExternalLink, Loader2, Star, ShieldAlert } from "lucide-react";
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
  averageRating?: number | null;
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
      "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.05)]",
  },
  FAILED: {
    label: "Failed",
    className:
      "border-red-500/20 bg-red-500/5 text-red-600 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400",
  },
  PROCESSING: {
    label: "Processing",
    className:
      "border-blue-500/20 bg-blue-500/5 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-400 animate-pulse",
    animated: true,
  },
  PENDING: {
    label: "Pending",
    className:
      "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400",
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

function RatingMiniStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Rating: ${rating} out of 5 stars`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3 w-3",
            i < Math.round(rating)
              ? "fill-amber-450 text-amber-500"
              : "text-muted-foreground/25 fill-transparent"
          )}
          strokeWidth={2}
        />
      ))}
    </div>
  );
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
    (session.sourceType === "URL"
      ? "URL Analysis"
      : session.sourceType === "PASTE"
        ? "Pasted reviews"
        : "CSV Analysis");

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
        "group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/65 p-4.5 backdrop-blur-md",
        "transition-all duration-300 hover:border-primary/20 hover:shadow-md hover:scale-[1.005]",
        isDeleting && "pointer-events-none opacity-40"
      )}
    >
      <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
        {/* Source type icon */}
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/65 shadow-inner transition-colors group-hover:border-primary/20 group-hover:bg-primary/5">
          {session.sourceType === "URL" ? (
            <Globe className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
          ) : session.sourceType === "PASTE" ? (
            <ClipboardPaste className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
          ) : (
            <FileText className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden />
          )}
        </div>

        {/* Info block */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-bold text-foreground tracking-tight max-w-[260px] md:max-w-md">
              {displayName}
            </p>

            {/* Status badge */}
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-tight uppercase",
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

          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
            <span className="font-medium">{formatNumber(session.totalReviews)} reviews</span>
            <span className="text-border/60 select-none">•</span>
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded border border-border/50 font-bold tracking-wider">{session.sourceType}</span>
            <span className="text-border/60 select-none">•</span>
            <span>{formatRelativeTime(session.createdAt)}</span>
            {session.averageRating != null && (
              <>
                <span className="text-border/60 select-none">•</span>
                <span className="flex items-center gap-1.5 bg-amber-500/5 dark:bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-foreground font-semibold">
                  <RatingMiniStars rating={session.averageRating} />
                  <span className="font-mono text-[11px] text-amber-600 dark:text-amber-400">
                    {session.averageRating.toFixed(1)}
                  </span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border/40 pt-3 sm:border-t-0 sm:pt-0">
        {isViewable && (
          <Button
            variant="secondary"
            size="sm"
            className="h-9 gap-1.5 px-3.5 text-xs font-semibold shadow-xs hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            asChild
          >
            <Link href={`/dashboard/${session.shareableSlug}`}>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              Open Analysis
            </Link>
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3.5 text-xs font-semibold transition-all duration-300 border border-transparent",
            confirmDelete
              ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive-foreground shadow-sm"
              : "text-muted-foreground hover:text-destructive hover:bg-destructive/5"
          )}
          onClick={handleDeleteClick}
          disabled={isDeleting}
          aria-label={confirmDelete ? "Confirm delete" : "Delete session"}
          title={confirmDelete ? "Click again to confirm" : "Delete"}
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : confirmDelete ? (
            <span className="flex items-center gap-1 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" />
              Confirm?
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}

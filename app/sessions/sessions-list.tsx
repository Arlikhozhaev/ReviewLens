"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { BarChart3, Plus, Search, SlidersHorizontal, X } from "lucide-react";
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
  const [sessions, setSessions] = useState(initialSessions);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sourceFilter, setSourceFilter] = useState<string>("ALL");

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

  // Filter logic
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      (session.fileName ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (session.shareableSlug ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (session.sourceType ?? "").toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" || session.status === statusFilter;

    const matchesSource =
      sourceFilter === "ALL" || session.sourceType.toUpperCase() === sourceFilter.toUpperCase();

    return matchesSearch && matchesStatus && matchesSource;
  });

  const statuses = [
    { value: "ALL", label: "All Status" },
    { value: "COMPLETED", label: "Completed" },
    { value: "PROCESSING", label: "Processing" },
    { value: "PENDING", label: "Pending" },
    { value: "FAILED", label: "Failed" },
  ];

  const sources = [
    { value: "ALL", label: "All Sources" },
    { value: "CSV", label: "CSV File" },
    { value: "URL", label: "Product URL" },
  ];

  function handleClearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setSourceFilter("ALL");
  }

  if (initialSessions.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No analyses yet"
        description="Upload a CSV review sheet to run your first automated AI theme analysis."
        action={
          <Button size="sm" asChild className="shadow-md">
            <Link href="/analyze">
              <Plus className="mr-1.5 h-4 w-4" />
              New analysis
            </Link>
          </Button>
        }
        className="py-20 bg-card/45 border border-border/80 rounded-2xl backdrop-blur-md shadow-sm"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Search & Filter Controls Panel */}
      <div className="flex flex-col gap-4 p-4 rounded-2xl border border-border/80 bg-card/50 backdrop-blur-md shadow-xs md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/85" />
          <input
            type="text"
            placeholder="Search sessions by file name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 rounded-xl border border-border/80 bg-background/55 pl-9 pr-8 text-sm placeholder:text-muted-foreground/75 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all duration-200"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground transition-colors"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/55 px-2.5 py-1.5 h-10">
            <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
              aria-label="Filter by status"
            >
              {statuses.map((st) => (
                <option key={st.value} value={st.value} className="bg-card text-foreground font-sans">
                  {st.label}
                </option>
              ))}
            </select>
          </div>

          {/* Source Dropdown */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/80 bg-background/55 px-2.5 py-1.5 h-10">
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer pr-1"
              aria-label="Filter by source"
            >
              {sources.map((src) => (
                <option key={src.value} value={src.value} className="bg-card text-foreground font-sans">
                  {src.label}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Button */}
          {(search !== "" || statusFilter !== "ALL" || sourceFilter !== "ALL") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-10 text-xs gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Sessions Cards Container */}
      {filteredSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-dashed border-border/80 bg-card/25 py-16 animate-in">
          <SlidersHorizontal className="h-8 w-8 text-muted-foreground/50 mb-3" />
          <p className="text-sm font-semibold text-foreground">No matching sessions</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
            We couldn&apos;t find any analysis sessions matching your active search terms or filter selection.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="mt-4 text-xs h-8"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
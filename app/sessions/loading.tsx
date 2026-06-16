import { Navbar } from "@/components/layout/navbar";

function SkeletonCard() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-muted" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-52 animate-pulse rounded bg-muted" />
        <div className="h-3 w-36 animate-pulse rounded bg-muted" />
      </div>
      <div className="flex gap-1.5">
        <div className="h-8 w-14 animate-pulse rounded-lg bg-muted" />
        <div className="h-8 w-8 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function SessionsLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container max-w-3xl space-y-6 py-10">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-7 w-28 animate-pulse rounded-lg bg-muted" />
            <div className="h-4 w-48 animate-pulse rounded-lg bg-muted" />
          </div>
          <div className="h-9 w-32 animate-pulse rounded-lg bg-muted" />
        </div>

        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>

        <div className="h-px bg-border" />

        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </main>
    </div>
  );
}
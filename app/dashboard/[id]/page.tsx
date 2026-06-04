import { Navbar } from "@/components/layout/navbar";
import { LoadingSpinner } from "@/components/shared/loading-spinner";

interface Props {
  params: { id: string };
}

export default function DashboardPage({ params }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <LoadingSpinner size="lg" />
        <h1 className="text-xl font-semibold">Analysis queued</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Session{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
            {params.id}
          </code>{" "}
          is saved. The AI pipeline lands in Phase 3.
        </p>
      </main>
    </div>
  );
}
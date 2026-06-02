import { Navbar } from "@/components/layout/navbar";

export default function AnalyzePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container flex flex-1 flex-col items-center justify-center gap-3 py-16 text-center">
        <h1 className="text-2xl font-bold">Analyze Reviews</h1>
        <p className="text-muted-foreground text-sm max-w-sm">
          CSV upload and URL analysis coming in Phase 2.
        </p>
      </main>
    </div>
  );
}
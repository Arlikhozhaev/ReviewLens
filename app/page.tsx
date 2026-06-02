import Link from "next/link";
import { ArrowRight, BarChart3, Brain, FileUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Navbar } from "@/components/layout/navbar";

const FEATURES = [
  {
    icon: FileUp,
    title: "Upload or paste a URL",
    description:
      "Drop a CSV of reviews or paste any product URL. ReviewLens handles extraction.",
  },
  {
    icon: Brain,
    title: "AI clusters the feedback",
    description:
      "Embeddings + k-means groups hundreds of reviews into coherent themes automatically.",
  },
  {
    icon: BarChart3,
    title: "Visual insight dashboard",
    description:
      "Sentiment charts, theme breakdowns, and quote cards you can share with your team.",
  },
  {
    icon: Zap,
    title: "Under 10 seconds",
    description:
      "50 reviews analyzed faster than you can read one. Batched embeddings keep it fast.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <section className="container flex flex-col items-center justify-center gap-6 pb-12 pt-24 text-center md:pt-36">
          <Badge
            variant="secondary"
            className="rounded-full px-4 py-1.5 text-xs font-medium tracking-wide"
          >
            AI-powered · Built for product teams
          </Badge>

          <h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Turn reviews into{" "}
            <span className="bg-gradient-to-r from-primary to-indigo-400 bg-clip-text text-transparent">
              product insights
            </span>
          </h1>

          <p className="max-w-xl text-balance text-lg leading-relaxed text-muted-foreground">
            Stop reading reviews one by one. ReviewLens clusters hundreds of
            customer reviews into actionable themes — in seconds.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button size="lg" asChild className="gap-2">
              <Link href="/analyze">
                Start analyzing <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="#features">See how it works</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            No account required · First 50 reviews free
          </p>
        </section>

        <Separator className="mx-auto max-w-5xl" />

        {/* ── Features ──────────────────────────────────────────────── */}
        <section id="features" className="container py-20 md:py-28">
          <div className="mb-12 text-center">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              How it works
            </h2>
            <p className="mt-3 text-muted-foreground">
              Four steps from raw reviews to clear decisions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/30 hover:shadow-sm"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/15">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    0{i + 1}
                  </span>
                  <h3 className="font-semibold text-sm leading-snug">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA banner ────────────────────────────────────────────── */}
        <section className="border-t border-border bg-muted/30">
          <div className="container flex flex-col items-center gap-4 py-16 text-center md:flex-row md:justify-between md:text-left">
            <div>
              <h2 className="text-xl font-bold">Ready to stop guessing?</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Upload a CSV and see what your customers are actually saying.
              </p>
            </div>
            <Button size="lg" asChild className="shrink-0 gap-2">
              <Link href="/analyze">
                Analyze your reviews <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="container flex items-center justify-between py-6 text-xs text-muted-foreground">
          <span>ReviewLens</span>
          <span>Built with Next.js + OpenAI</span>
        </div>
      </footer>
    </div>
  );
}
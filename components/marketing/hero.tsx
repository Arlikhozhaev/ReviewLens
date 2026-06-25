import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroDropZone } from "@/components/marketing/hero-drop-zone";
import { ReportPreview } from "@/components/marketing/report-preview";

const HERO_STATS = [
  { value: "<60s", label: "Average analysis time" },
  { value: "500+", label: "Reviews per upload" },
  { value: "Magic link", label: "Sign in — no password" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
      />

      <div className="container relative pb-20 pt-16 md:pb-28 md:pt-24">
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <div
            className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur-sm"
            style={{ animationDelay: "0ms" }}
          >
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
            AI-powered review intelligence
          </div>

          <h1
            className="text-display animate-fade-up max-w-3xl text-balance text-foreground"
            style={{ animationDelay: "60ms" }}
          >
            Every review.{" "}
            <span className="text-gradient">One clear picture.</span>
          </h1>

          <p
            className="animate-fade-up mt-6 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground md:text-lg"
            style={{ animationDelay: "120ms" }}
          >
            Upload a CSV of customer reviews and get instant themes, sentiment
            breakdown, and an executive summary — so your team knows exactly
            what to fix, ship, or celebrate.
          </p>

          <div
            className="animate-fade-up mt-8 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
            style={{ animationDelay: "180ms" }}
          >
            <Button size="lg" asChild className="h-11 gap-2 px-6 shadow-md">
              <Link href="/analyze">
                Analyze your reviews
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="h-11 gap-2 bg-card/60 px-6 backdrop-blur-sm"
            >
              <Link href="#demo">
                <Play className="h-3.5 w-3.5 fill-current" />
                Watch it work
              </Link>
            </Button>
          </div>

          <div
            className="animate-fade-up mt-8 flex w-full justify-center"
            style={{ animationDelay: "220ms" }}
          >
            <HeroDropZone />
          </div>

          <ul
            className="animate-fade-up mt-10 grid w-full max-w-xl grid-cols-3 gap-4 border-t border-border/60 pt-8"
            style={{ animationDelay: "280ms" }}
          >
            {HERO_STATS.map((stat) => (
              <li key={stat.label} className="text-center">
                <p className="font-mono text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  {stat.value}
                </p>
                <p className="mt-1 text-xs leading-snug text-muted-foreground">
                  {stat.label}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div
          className="animate-fade-up relative mx-auto mt-16 max-w-3xl"
          style={{ animationDelay: "360ms" }}
          aria-hidden
        >
          <div className="glow-ring animate-float rounded-2xl">
            <ReportPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

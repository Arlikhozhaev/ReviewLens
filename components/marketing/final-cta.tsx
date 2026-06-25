import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/marketing/reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/60">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />

      <Reveal className="container relative flex flex-col items-center gap-6 py-24 text-center md:py-32">
        <span className="text-label">Get started</span>
        <h2 className="text-report-h1 max-w-xl text-balance">
          See what your customers are{" "}
          <span className="text-gradient">really saying</span>
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
          Upload your first dataset and get a full report in under a minute.
          No credit card. Sign in with email. Just insights.
        </p>
        <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
          <Button size="lg" asChild className="h-11 gap-2 px-7 shadow-md">
            <Link href="/analyze">
              Analyze your reviews
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-11 bg-card/60 px-7 backdrop-blur-sm"
          >
            <Link href="/sessions">View past sessions</Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
}

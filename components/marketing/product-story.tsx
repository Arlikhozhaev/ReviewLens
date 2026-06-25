import { FileUp, Sparkles, Layers, FileText, ArrowRight } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const STEPS = [
  {
    n: "01",
    icon: FileUp,
    title: "Upload your CSV",
    description:
      "Drop a CSV export from Amazon, Shopify, App Store, or your own database. No setup or integration required.",
    accent: "from-blue-500/10 to-transparent",
  },
  {
    n: "02",
    icon: Sparkles,
    title: "Every review is read",
    description:
      "Each review is converted into an embedding — a numerical representation of its meaning and tone.",
    accent: "from-violet-500/10 to-transparent",
  },
  {
    n: "03",
    icon: Layers,
    title: "Similar feedback is grouped",
    description:
      "Reviews describing the same issue in different words are clustered together automatically.",
    accent: "from-amber-500/10 to-transparent",
  },
  {
    n: "04",
    icon: FileText,
    title: "You get the report",
    description:
      "Top complaints, top praises, sentiment breakdown, and an executive summary — ready to share.",
    accent: "from-emerald-500/10 to-transparent",
  },
] as const;

export function ProductStory() {
  return (
    <section
      id="how-it-works"
      className="border-t border-border/60 bg-muted/10"
    >
      <div className="container py-20 md:py-28">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-label">How it works</span>
          <h2 className="text-report-h1 mt-3 text-balance">
            From raw reviews to a decision in four steps
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            No manual tagging. No keyword lists. Just upload and let the pipeline
            do the heavy lifting.
          </p>
        </Reveal>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <Reveal key={step.n} delay={i * 80} className="relative">
              {i < STEPS.length - 1 && (
                <div
                  className="absolute -right-2.5 top-12 hidden h-px w-5 bg-border lg:block"
                  aria-hidden
                />
              )}
              <div
                className={`surface-card relative h-full overflow-hidden p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_oklch(0_0_0/0.06)]`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${step.accent}`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-5 flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
                      <step.icon
                        className="h-5 w-5"
                        strokeWidth={2}
                        aria-hidden
                      />
                    </span>
                    <span className="font-mono text-2xl font-black leading-none text-muted-foreground/15">
                      {step.n}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  {i === STEPS.length - 1 && (
                    <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                      Ready to share
                      <ArrowRight className="h-3 w-3" aria-hidden />
                    </div>
                  )}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

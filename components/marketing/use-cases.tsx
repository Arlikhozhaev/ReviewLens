import { LineChart, Rocket, Users } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const PERSONAS = [
  {
    icon: LineChart,
    role: "Product managers",
    quote:
      "Stop spending hours reading reviews one by one. Get the top themes ranked by frequency in a shareable report.",
  },
  {
    icon: Rocket,
    role: "Founders & operators",
    quote:
      "Know what's breaking trust before it shows up in churn. One upload, one clear picture of customer sentiment.",
  },
  {
    icon: Users,
    role: "CX & support leads",
    quote:
      "Turn thousands of support tickets and reviews into prioritized action items your team can act on this week.",
  },
] as const;

export function UseCases() {
  return (
    <section className="border-t border-border/60">
      <div className="container py-20 md:py-28">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-label">Who it&apos;s for</span>
          <h2 className="text-report-h1 mt-3 text-balance">
            Built for teams who ship based on feedback
          </h2>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {PERSONAS.map((persona, i) => (
            <Reveal key={persona.role} delay={i * 80}>
              <figure className="surface-card h-full p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
                  <persona.icon
                    className="h-5 w-5"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <figcaption className="text-sm font-semibold tracking-tight">
                  {persona.role}
                </figcaption>
                <blockquote className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{persona.quote}&rdquo;
                </blockquote>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

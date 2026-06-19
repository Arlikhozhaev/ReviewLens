import { Reveal } from "@/components/marketing/reveal";
import { LiveDemo } from "@/components/marketing/live-demo";

export function LiveDemoSection() {
  return (
    <section id="demo" className="relative overflow-hidden border-t border-border/60">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_100%,var(--brand-glow),transparent)]"
        aria-hidden
      />

      <div className="container relative py-20 md:py-28">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal className="max-w-lg lg:max-w-none">
            <span className="text-label">See it work</span>
            <h2 className="text-report-h1 mt-3 text-balance">
              Raw reviews go in. A structured report comes out.
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
              Watch how ReviewLens transforms messy, unstructured feedback into
              clear themes with sentiment scores — the same pipeline that powers
              your real analyses.
            </p>

            <ul className="mt-8 space-y-3">
              {[
                "1,284 reviews processed in under a minute",
                "Themes ranked by how often they appear",
                "Sentiment tagged per theme automatically",
              ].map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-2.5 text-sm text-muted-foreground"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={120} className="flex justify-center lg:justify-end">
            <LiveDemo />
          </Reveal>
        </div>
      </div>
    </section>
  );
}

import { Database, Eye, Server } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const SECURITY_POINTS = [
  {
    icon: Database,
    title: "Your data, isolated per analysis",
    body: "Reviews are stored in a private PostgreSQL database, scoped to your account per analysis. There's no shared pool of data across users.",
  },
  {
    icon: Eye,
    title: "Your account, your analyses",
    body: "Sign in with a magic link — no password. Analyses are scoped to your account. Share report links only with people you choose.",
  },
  {
    icon: Server,
    title: "Transparent about AI processing",
    body: "Review text is sent to OpenAI's API to generate embeddings and summaries. That's the only third party involved, and it's the same step every analysis goes through.",
  },
] as const;

export function SecuritySection() {
  return (
    <section className="border-t border-border/60 bg-muted/20">
      <div className="container py-20 md:py-28">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-label">Data handling</span>
          <h2 className="text-report-h1 mt-3 text-balance">
            Built to be safe to use at work
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Your customer feedback is sensitive. We treat it that way — isolated,
            private, and never used to train models.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {SECURITY_POINTS.map((point, i) => (
            <Reveal key={point.title} delay={i * 80}>
              <div className="surface-card h-full p-6">
                <span className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-primary">
                  <point.icon
                    className="h-5 w-5"
                    strokeWidth={2}
                    aria-hidden
                  />
                </span>
                <h3 className="text-base font-semibold tracking-tight">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {point.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

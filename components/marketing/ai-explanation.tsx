import { Brain, GitMerge, MessageSquareText } from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const EXPLANATION_BLOCKS = [
  {
    icon: Brain,
    label: "Embeddings",
    title: "Meaning, not keywords",
    body: "Every review is converted into a numerical representation of its meaning. Two reviews describing the same problem in completely different words end up close together mathematically.",
  },
  {
    icon: GitMerge,
    label: "Clustering",
    title: "Groups that make sense",
    body: "Reviews are grouped by similarity using k-means — a standard statistical method, not a black box. The number of groups adapts to how much feedback you upload.",
  },
  {
    icon: MessageSquareText,
    label: "Summarization",
    title: "Plain language, grounded in data",
    body: "A language model reads the reviews inside each group and writes a label, description, and sentiment — checked against the actual reviews, not invented from a prompt alone.",
  },
] as const;

export function AiExplanation() {
  return (
    <section className="border-t border-border/60">
      <div className="container py-20 md:py-28">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <span className="text-label">Under the hood</span>
          <h2 className="text-report-h1 mt-3 text-balance">
            How ReviewLens actually reads your reviews
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
            Three proven techniques working together — transparent, explainable,
            and built on OpenAI&apos;s embedding and language models.
          </p>
        </Reveal>

        <div className="grid gap-5 md:grid-cols-3 md:gap-6">
          {EXPLANATION_BLOCKS.map((block, i) => (
            <Reveal key={block.label} delay={i * 80}>
              <div className="surface-card group h-full p-6 transition-shadow duration-300 hover:shadow-[0_8px_30px_oklch(0_0_0/0.06)]">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-primary transition-transform duration-200 group-hover:scale-105">
                    <block.icon
                      className="h-5 w-5"
                      strokeWidth={2}
                      aria-hidden
                    />
                  </span>
                  <span className="text-label">{block.label}</span>
                </div>
                <h3 className="text-base font-semibold tracking-tight">
                  {block.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {block.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

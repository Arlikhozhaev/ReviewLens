import {
  BarChart3,
  Brain,
  FileUp,
  Layers3,
  Share2,
  Sparkles,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const FEATURES = [
  {
    icon: FileUp,
    title: "Drop a CSV, get insights",
    description:
      "Upload any review export from Amazon, Shopify, App Store, or your own database. Up to 500 reviews per analysis.",
    className: "md:col-span-2 md:row-span-1",
    highlight: true,
  },
  {
    icon: Brain,
    title: "Semantic clustering",
    description:
      "Reviews about the same issue — even with different wording — are grouped automatically using AI embeddings.",
    className: "md:col-span-1",
    highlight: false,
  },
  {
    icon: BarChart3,
    title: "Sentiment breakdown",
    description:
      "See the ratio of positive, negative, mixed, and neutral feedback at a glance.",
    className: "md:col-span-1",
    highlight: false,
  },
  {
    icon: Sparkles,
    title: "AI-written summaries",
    description:
      "Each theme gets a plain-language label and description, grounded in the actual reviews — not generic fluff.",
    className: "md:col-span-1",
    highlight: false,
  },
  {
    icon: Layers3,
    title: "Executive overview",
    description:
      "A concise summary of what customers love, what they hate, and what to prioritize next.",
    className: "md:col-span-1",
    highlight: false,
  },
  {
    icon: Share2,
    title: "Share with one link",
    description:
      "Send read-only reports to PMs, founders, or clients — copy the link or open your mail app. Optional password and expiry. No custom domain required.",
    className: "md:col-span-2",
    highlight: false,
  },
] as const;

export function FeaturesGrid() {
  return (
    <section id="features" className="container py-20 md:py-28">
      <Reveal className="mx-auto mb-14 max-w-2xl text-center">
        <span className="text-label">Features</span>
        <h2 className="text-report-h1 mt-3 text-balance">
          Everything you need to understand customer feedback
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">
          From raw CSV to a decision-ready report — no spreadsheets, no
          guesswork, no weeks of manual tagging.
        </p>
      </Reveal>

      <div className="grid gap-4 md:grid-cols-3 md:gap-5">
        {FEATURES.map((feature, i) => (
          <Reveal
            key={feature.title}
            delay={i * 60}
            className={`group surface-card flex flex-col p-6 transition-all duration-300 hover:shadow-[0_8px_30px_oklch(0_0_0/0.08)] ${feature.className} ${
              feature.highlight
                ? "border-primary/20 bg-gradient-to-br from-brand-muted/80 to-card"
                : ""
            }`}
          >
            <span
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${
                feature.highlight
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-brand-muted text-primary"
              }`}
            >
              <feature.icon className="h-5 w-5" strokeWidth={2} aria-hidden />
            </span>
            <h3 className="text-base font-semibold tracking-tight">
              {feature.title}
            </h3>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

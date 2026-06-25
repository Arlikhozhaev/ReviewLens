import {
  Clock,
  FileSpreadsheet,
  Link2,
  Lock,
  Share2,
  Shield,
} from "lucide-react";
import { Reveal } from "@/components/marketing/reveal";

const TRUST_ITEMS = [
  {
    icon: Clock,
    title: "Results in seconds",
    description: "Not days of manual reading",
  },
  {
    icon: FileSpreadsheet,
    title: "Any CSV export",
    description: "No integration required",
  },
  {
    icon: Share2,
    title: "Shareable reports",
    description: "One link, no login to view",
  },
  {
    icon: Lock,
    title: "Private by default",
    description: "Data never trains models",
  },
  {
    icon: Shield,
    title: "Work-safe AI",
    description: "Transparent OpenAI processing",
  },
  {
    icon: Link2,
    title: "Magic-link sign-in",
    description: "No password — email link only",
  },
] as const;

export function TrustStrip() {
  return (
    <section className="border-y border-border/60 bg-muted/20">
      <Reveal className="container py-12 md:py-14">
        <p className="mb-8 text-center text-sm text-muted-foreground">
          Built for product teams who make decisions on real feedback — not
          gut feel.
        </p>

        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 lg:gap-6">
          {TRUST_ITEMS.map((item) => (
            <li
              key={item.title}
              className="group flex flex-col items-center rounded-xl border border-transparent px-3 py-4 text-center transition-colors hover:border-border/60 hover:bg-card/60"
            >
              <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-muted text-primary transition-transform duration-200 group-hover:scale-105">
                <item.icon className="h-4 w-4" strokeWidth={2} aria-hidden />
              </span>
              <span className="text-xs font-semibold leading-snug">
                {item.title}
              </span>
              <span className="mt-1 text-[11px] leading-snug text-muted-foreground">
                {item.description}
              </span>
            </li>
          ))}
        </ul>
      </Reveal>
    </section>
  );
}

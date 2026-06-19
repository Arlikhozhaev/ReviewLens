import Image from "next/image";
import { Reveal } from "@/components/marketing/reveal";
import { SOCIAL_PROOF } from "@/lib/social-proof";

export function SocialProof() {
  if (!SOCIAL_PROOF.enabled) return null;

  const hasLogos = SOCIAL_PROOF.logos.length > 0;
  const hasTestimonials = SOCIAL_PROOF.testimonials.length > 0;

  if (!hasLogos && !hasTestimonials) return null;

  return (
    <section className="border-y border-border/60 bg-muted/10">
      <Reveal className="container py-12 md:py-14">
        {hasLogos && (
          <div className="text-center">
            <p className="text-label mb-8">{SOCIAL_PROOF.headline}</p>
            <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {SOCIAL_PROOF.logos.map((logo) => (
                <li key={logo.name}>
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={120}
                    height={32}
                    className="h-7 w-auto opacity-60 grayscale transition-opacity hover:opacity-100"
                  />
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasTestimonials && (
          <div
            className={`grid gap-5 md:grid-cols-3 ${hasLogos ? "mt-12" : ""}`}
          >
            {SOCIAL_PROOF.testimonials.map((item) => (
              <figure
                key={item.author}
                className="surface-card p-6 text-left"
              >
                <blockquote className="text-sm leading-relaxed text-muted-foreground">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-4 text-xs">
                  <span className="font-semibold text-foreground">
                    {item.author}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    · {item.role}, {item.company}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Reveal>
    </section>
  );
}

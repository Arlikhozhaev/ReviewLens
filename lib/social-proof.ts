/**
 * Plug in customer logos and testimonials here when available.
 * Set `enabled: true` and populate arrays to show the SocialProof section.
 */

export const SOCIAL_PROOF = {
  enabled: false,
  headline: "Trusted by product teams worldwide",
  logos: [] as { name: string; src: string }[],
  testimonials: [] as {
    quote: string;
    author: string;
    role: string;
    company: string;
  }[],
} as const;

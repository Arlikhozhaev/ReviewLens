import Link from "next/link";
import { ScanSearch } from "lucide-react";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";

const PRODUCT_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/sessions", label: "Sessions" },
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
] as const;

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/terms", label: "Terms of Service" },
] as const;

function FooterLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-md text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      {label}
    </Link>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-border/60 bg-muted/10">
      <div className="container py-14 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-[1.5fr_1fr_1fr]">
          <div className="max-w-sm space-y-4">
            <div className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <ScanSearch className="h-4 w-4" strokeWidth={2.25} aria-hidden />
              </span>
              {APP_NAME}
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              {APP_TAGLINE}. Upload reviews, get themes, sentiment, and
              summaries — in seconds.
            </p>
          </div>

          <div className="space-y-4">
            <span className="text-label">Product</span>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <span className="text-label">Legal</span>
            <ul className="space-y-2.5">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col-reverse items-center justify-between gap-4 border-t border-border/60 pt-6 sm:flex-row">
          <span className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </span>
          <span className="text-xs text-muted-foreground">
            Built with Next.js, Prisma & OpenAI
          </span>
        </div>
      </div>
    </footer>
  );
}

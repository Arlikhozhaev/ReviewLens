"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#demo", label: "Demo" },
] as const;

const APP_LINKS = [
  { href: "/analyze", label: "Analyze" },
  { href: "/sessions", label: "Sessions" },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-xl items-center gap-6">
        <Link
          href="/"
          className="group flex shrink-0 items-center gap-2.5 text-[15px] font-semibold tracking-tight text-foreground"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
            <ScanSearch className="h-4 w-4" strokeWidth={2.25} aria-hidden />
          </span>
          {APP_NAME}
        </Link>

        {isHome && (
          <nav className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors duration-150 hover:bg-accent hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        )}

        {!isHome && (
          <nav className="hidden items-center gap-1 sm:flex">
            {APP_LINKS.map((link) => {
              const isActive = pathname?.startsWith(link.href) ?? false;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition-colors duration-150",
                    isActive
                      ? "bg-accent font-medium text-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {!isHome && (
            <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
              <Link href="/">Home</Link>
            </Button>
          )}
          <Button size="sm" asChild className="gap-1.5 shadow-sm">
            <Link href="/analyze">
              Start free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

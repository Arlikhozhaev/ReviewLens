import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BarChart3 } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center">
        {/* Brand */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 font-semibold text-sm tracking-tight"
        >
          <BarChart3 className="h-4 w-4 text-primary" />
          {APP_NAME}
        </Link>

        <Separator orientation="vertical" className="h-4" />

        {/* Nav links */}
        <nav className="ml-4 flex items-center gap-5 text-sm text-muted-foreground">
          <Link
            href="/analyze"
            className="transition-colors hover:text-foreground"
          >
            Analyze
          </Link>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            Sign in
          </Button>
          <Button size="sm" asChild>
            <Link href="/analyze">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
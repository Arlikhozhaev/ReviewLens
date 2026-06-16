import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-xl items-center">
        {/* Brand */}
        <Link
          href="/"
          className="mr-6 flex items-center gap-2 font-semibold text-sm tracking-tight"
        >
          <BarChart3 className="h-4 w-4 text-violet-600" aria-hidden />
          {APP_NAME}
        </Link>

        <Separator orientation="vertical" className="h-4" />

        {/* Nav links */}
        <nav className="ml-4 flex items-center gap-5 text-sm">
          <Link
            href="/analyze"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Analyze
          </Link>
          <Link
            href="/sessions"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sessions
          </Link>
        </nav>

        {/* Right side */}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" asChild>
            <Link href="/analyze">New analysis</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
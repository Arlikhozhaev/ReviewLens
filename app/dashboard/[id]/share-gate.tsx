"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Lock, ScanSearch, Loader2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { unlockShare } from "@/lib/actions/share";
import { APP_NAME } from "@/lib/constants";

function GateShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      {children}
    </div>
  );
}

export function ShareGate({ slug }: { slug: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await unlockShare(slug, password);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <GateShell>
      <div className="surface-card w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Lock className="h-5 w-5" strokeWidth={2.25} />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">
            Password required
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This {APP_NAME} report is protected. Enter the password to view it.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="share-password">Password</Label>
            <Input
              id="share-password"
              type="password"
              required
              autoFocus
              autoComplete="off"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Unlocking…
              </>
            ) : (
              "View report"
            )}
          </Button>
        </form>
      </div>
    </GateShell>
  );
}

export function ShareExpired() {
  return (
    <GateShell>
      <div className="surface-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Clock className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Link expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This shared report is no longer available. Ask the owner for an
          updated link.
        </p>
        <Button asChild variant="outline" className="mt-6 gap-2">
          <Link href="/">
            <ScanSearch className="h-4 w-4" />
            Back to {APP_NAME}
          </Link>
        </Button>
      </div>
    </GateShell>
  );
}

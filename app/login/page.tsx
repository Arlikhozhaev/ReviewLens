"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Mail, ScanSearch, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_NAME } from "@/lib/constants";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/analyze";
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("email", {
        email,
        callbackUrl,
        redirect: false,
      });

      if (result?.error) {
        setError("Could not send sign-in link. Try again.");
        return;
      }

      window.location.href = `/login/verify?email=${encodeURIComponent(email)}`;
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="surface-card w-full max-w-md p-8">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <ScanSearch className="h-5 w-5" strokeWidth={2.25} />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">
          Sign in to {APP_NAME}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll email you a magic link — no password needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-9"
            />
          </div>
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
              Sending link…
            </>
          ) : (
            <>
              Continue with email
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        <Link href="/" className="underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <Suspense
        fallback={
          <div className="surface-card w-full max-w-md p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}

import Link from "next/link";
import { Mail, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/constants";

export default function LoginVerifyPage({
  searchParams,
}: {
  searchParams: { email?: string };
}) {
  const email = searchParams.email;

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <div className="surface-card w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-muted text-primary">
          <Mail className="h-5 w-5" />
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Check your email</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {email ? (
            <>
              We sent a sign-in link to{" "}
              <span className="font-medium text-foreground">{email}</span>.
            </>
          ) : (
            <>We sent you a sign-in link.</>
          )}{" "}
          Click it to continue to {APP_NAME}.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          In development without Resend, check your terminal for the magic link.
        </p>
        <Button variant="outline" className="mt-8" asChild>
          <Link href="/login">
            <ScanSearch className="mr-2 h-4 w-4" />
            Use a different email
          </Link>
        </Button>
      </div>
    </div>
  );
}

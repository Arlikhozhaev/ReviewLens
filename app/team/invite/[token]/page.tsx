"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { apiPost } from "@/lib/api";

interface Props {
  params: { token: string };
}

export default function AcceptInvitePage({ params }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">(
    "loading"
  );
  const [orgName, setOrgName] = useState<string | null>(null);

  useEffect(() => {
    setStatus("ready");
  }, []);

  async function accept() {
    setStatus("loading");
    try {
      const data = await apiPost<{ slug: string; name: string }>(
        "/api/orgs/invites/accept",
        { token: params.token }
      );
      setOrgName(data.name);
      setStatus("done");
      toast.success(`Joined ${data.name}`);
      router.push("/team");
    } catch (err) {
      setStatus("error");
      toast.error(
        err instanceof Error ? err.message : "Could not accept invite"
      );
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="container flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Users className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold">Join workspace</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {status === "done" && orgName
              ? `You're now a member of ${orgName}.`
              : "You've been invited to collaborate on shared analyses in ReviewLens."}
          </p>
          {status !== "done" && (
            <Button
              className="mt-6 w-full gap-2"
              onClick={() => void accept()}
              disabled={status === "loading"}
            >
              {status === "loading" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining…
                </>
              ) : (
                "Accept invite"
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}

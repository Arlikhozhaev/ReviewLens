"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Building2,
  Copy,
  Loader2,
  Mail,
  Plus,
  Shield,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/layout/navbar";
import { apiFetch, apiPost } from "@/lib/api";
import type { OrgSummary } from "@/app/api/orgs/route";

interface OrgDetail {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  sessionCount: number;
  members: {
    id: string;
    role: string;
    joinedAt: string;
    user: { id: string; name: string | null; email: string | null };
  }[];
  pendingInvites: {
    id: string;
    email: string;
    role: string;
    expiresAt: string;
  }[];
}

export function TeamPageClient() {
  const [orgs, setOrgs] = useState<OrgSummary[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [detail, setDetail] = useState<OrgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [lastInviteUrl, setLastInviteUrl] = useState<string | null>(null);

  const loadOrgs = useCallback(async () => {
    const data = await apiFetch<{ orgs: OrgSummary[] }>("/api/orgs");
    setOrgs(data.orgs);
    if (data.orgs.length > 0 && !selectedSlug) {
      setSelectedSlug(data.orgs[0]!.slug);
    }
  }, [selectedSlug]);

  const loadDetail = useCallback(async (slug: string) => {
    const data = await apiFetch<{ org: OrgDetail }>(`/api/orgs/${slug}`);
    setDetail(data.org);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await loadOrgs();
      } catch {
        toast.error("Could not load workspaces");
      } finally {
        setLoading(false);
      }
    })();
  }, [loadOrgs]);

  useEffect(() => {
    if (!selectedSlug) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedSlug).catch(() => toast.error("Could not load workspace"));
  }, [selectedSlug, loadDetail]);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const data = await apiPost<{ org: OrgSummary }>("/api/orgs", {
        name: newName.trim(),
      });
      setOrgs((prev) => [...prev, data.org]);
      setSelectedSlug(data.org.slug);
      setNewName("");
      toast.success(`Created ${data.org.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create workspace");
    } finally {
      setCreating(false);
    }
  }

  async function handleInvite() {
    if (!selectedSlug || !inviteEmail.trim()) return;
    setInviting(true);
    try {
      const data = await apiPost<{ inviteUrl: string }>(
        `/api/orgs/${selectedSlug}`,
        { email: inviteEmail.trim(), role: "MEMBER" }
      );
      setLastInviteUrl(data.inviteUrl);
      setInviteEmail("");
      toast.success("Invite link created");
      await loadDetail(selectedSlug);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not invite member");
    } finally {
      setInviting(false);
    }
  }

  async function copyInvite() {
    if (!lastInviteUrl) return;
    await navigator.clipboard.writeText(lastInviteUrl);
    toast.success("Invite link copied");
  }

  const canManage =
    detail?.role === "OWNER" || detail?.role === "ADMIN";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      <div className="hero-mesh pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <Navbar />

      <main className="container relative max-w-4xl space-y-8 px-4 py-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Users className="h-3 w-3" />
            Team workspaces
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Shared <span className="text-gradient">workspace</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a team, invite colleagues, and share analysis history. Billing
            upgrades (Pro) are coming soon — Free includes unlimited members for now.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-muted-foreground">
            Loading workspaces…
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-xl border border-border bg-card/60 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Your teams
                </p>
                <div className="space-y-1">
                  {orgs.map((org) => (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedSlug(org.slug)}
                      className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                        selectedSlug === org.slug
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Building2 className="h-4 w-4 shrink-0" />
                      <span className="truncate font-medium">{org.name}</span>
                    </button>
                  ))}
                  {orgs.length === 0 && (
                    <p className="px-2 py-3 text-xs text-muted-foreground">
                      No workspace yet. Create one below.
                    </p>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card/60 p-3 space-y-2">
                <Label htmlFor="new-team" className="text-xs">
                  New workspace
                </Label>
                <Input
                  id="new-team"
                  placeholder="Acme Product Team"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
                <Button
                  className="w-full gap-2"
                  size="sm"
                  onClick={() => void handleCreate()}
                  disabled={creating || !newName.trim()}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Create team
                </Button>
              </div>
            </aside>

            <section className="rounded-2xl border border-border bg-card/60 p-6 shadow-sm backdrop-blur-md">
              {!detail ? (
                <p className="text-sm text-muted-foreground">
                  Select or create a workspace to manage members and shared analyses.
                </p>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold">{detail.name}</h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {detail.members.length} member
                        {detail.members.length === 1 ? "" : "s"} ·{" "}
                        {detail.sessionCount} shared{" "}
                        {detail.sessionCount === 1 ? "analysis" : "analyses"} ·{" "}
                        <span className="capitalize">{detail.plan.toLowerCase()} plan</span>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/sessions?scope=${detail.slug}`}>
                        View team sessions
                      </Link>
                    </Button>
                  </div>

                  <div>
                    <h3 className="mb-2 text-sm font-semibold">Members</h3>
                    <ul className="divide-y divide-border rounded-xl border border-border">
                      {detail.members.map((m) => (
                        <li
                          key={m.id}
                          className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-medium">
                              {m.user.name ?? m.user.email}
                            </p>
                            {m.user.name && (
                              <p className="truncate text-xs text-muted-foreground">
                                {m.user.email}
                              </p>
                            )}
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {m.role === "OWNER" && <Shield className="h-3 w-3" />}
                            {m.role}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {canManage && (
                    <div className="space-y-3 rounded-xl border border-dashed border-border bg-muted/30 p-4">
                      <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Invite by email
                      </h3>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Input
                          type="email"
                          placeholder="colleague@company.com"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                        />
                        <Button
                          onClick={() => void handleInvite()}
                          disabled={inviting || !inviteEmail.trim()}
                          className="shrink-0"
                        >
                          {inviting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Send invite"
                          )}
                        </Button>
                      </div>
                      {lastInviteUrl && (
                        <div className="flex gap-2">
                          <Input readOnly value={lastInviteUrl} className="text-xs" />
                          <Button variant="outline" size="icon" onClick={() => void copyInvite()}>
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {detail.pendingInvites.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Pending:{" "}
                          {detail.pendingInvites.map((i) => i.email).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}

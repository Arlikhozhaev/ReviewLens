"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Share2, Check, Copy, Loader2, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateShareSettings } from "@/lib/actions/share";

interface ShareSettingsDialogProps {
  sessionId: string;
  slug: string;
  hasSharePassword: boolean;
  shareExpiresAt: string | null;
}

type ExpiryChoice = "keep" | "never" | "1" | "7" | "30";

const EXPIRY_OPTIONS: { value: ExpiryChoice; label: string }[] = [
  { value: "keep", label: "Keep current" },
  { value: "never", label: "Never expires" },
  { value: "1", label: "Expires in 1 day" },
  { value: "7", label: "Expires in 7 days" },
  { value: "30", label: "Expires in 30 days" },
];

export function ShareSettingsDialog({
  sessionId,
  slug,
  hasSharePassword,
  shareExpiresAt,
}: ShareSettingsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");
  const [expiry, setExpiry] = useState<ExpiryChoice>("keep");

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/dashboard/${slug}`
      : `/dashboard/${slug}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2_000);
    } catch {
      toast.error("Could not copy link");
    }
  }

  async function applyUpdate(input: Parameters<typeof updateShareSettings>[0]) {
    setSaving(true);
    try {
      const result = await updateShareSettings(input);
      if (result.error) {
        toast.error(result.error);
        return false;
      }
      router.refresh();
      return true;
    } catch {
      toast.error("Something went wrong");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const input: Parameters<typeof updateShareSettings>[0] = { sessionId };
    if (password.trim()) input.password = password.trim();
    if (expiry !== "keep") {
      input.expiresInDays = expiry === "never" ? null : Number(expiry);
    }

    if (input.password === undefined && input.expiresInDays === undefined) {
      toast.info("Nothing to update");
      return;
    }

    const ok = await applyUpdate(input);
    if (ok) {
      toast.success("Share settings updated");
      setPassword("");
      setExpiry("keep");
    }
  }

  async function handleRemovePassword() {
    const ok = await applyUpdate({ sessionId, password: null });
    if (ok) toast.success("Password removed");
  }

  const expiryLabel = shareExpiresAt
    ? new Date(shareExpiresAt).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share report</DialogTitle>
          <DialogDescription>
            Anyone with the link can view this report. Add a password or expiry
            for sensitive data.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Link + copy */}
          <div className="space-y-2">
            <Label>Shareable link</Label>
            <div className="flex gap-2">
              <Input readOnly value={shareUrl} className="text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void handleCopy()}
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Current status */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
              {hasSharePassword ? (
                <>
                  <Lock className="h-3 w-3" /> Password protected
                </>
              ) : (
                <>
                  <Globe className="h-3 w-3" /> Public
                </>
              )}
            </span>
            {expiryLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-muted-foreground">
                Expires {expiryLabel}
              </span>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="share-set-password">
              {hasSharePassword ? "Change password" : "Set a password"}
            </Label>
            <Input
              id="share-set-password"
              type="password"
              autoComplete="new-password"
              placeholder="Leave blank to keep unchanged"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {hasSharePassword && (
              <button
                type="button"
                onClick={() => void handleRemovePassword()}
                disabled={saving}
                className="text-xs text-destructive underline-offset-4 hover:underline disabled:opacity-50"
              >
                Remove password protection
              </button>
            )}
          </div>

          {/* Expiry */}
          <div className="space-y-2">
            <Label htmlFor="share-expiry">Link expiry</Label>
            <select
              id="share-expiry"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value as ExpiryChoice)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            className="w-full gap-2"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              "Save share settings"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

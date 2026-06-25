"use client";

import { ClipboardPaste, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

export type ImportMethod = "csv" | "paste";

const METHODS: {
  id: ImportMethod;
  label: string;
  description: string;
  icon: typeof Upload;
}[] = [
  {
    id: "csv",
    label: "Upload CSV",
    description: "Spreadsheet export from Shopify, Amazon, or your CRM",
    icon: Upload,
  },
  {
    id: "paste",
    label: "Paste text",
    description: "Copy reviews from any product page or doc",
    icon: ClipboardPaste,
  },
];

interface ImportMethodSwitchProps {
  value: ImportMethod;
  onChange: (value: ImportMethod) => void;
  disabled?: boolean;
}

export function ImportMethodSwitch({
  value,
  onChange,
  disabled,
}: ImportMethodSwitchProps) {
  return (
    <div
      className="grid grid-cols-1 gap-2 sm:grid-cols-2"
      role="tablist"
      aria-label="Import method"
    >
      {METHODS.map((method) => {
        const Icon = method.icon;
        const active = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(method.id)}
            className={cn(
              "group relative flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              "disabled:pointer-events-none disabled:opacity-50",
              active
                ? "border-primary/40 bg-primary/5 shadow-sm ring-1 ring-primary/15"
                : "border-border/80 bg-card/40 hover:border-primary/25 hover:bg-card/70"
            )}
          >
            <span
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors",
                active
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border/80 bg-muted/60 text-muted-foreground group-hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
            </span>
            <span className="min-w-0 pt-0.5">
              <span
                className={cn(
                  "block text-sm font-semibold tracking-tight",
                  active ? "text-foreground" : "text-foreground/90"
                )}
              >
                {method.label}
              </span>
              <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                {method.description}
              </span>
            </span>
            {active && (
              <span
                className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary"
                aria-hidden
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

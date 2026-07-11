import { type ClassValue, clsx } from "clsx";
import { randomBytes } from "crypto";
import { twMerge } from "tailwind-merge";

// ── Styling ───────────────────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

// ── Formatting ────────────────────────────────────────────────────────────────

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function formatPercent(n: number, decimals = 1): string {
  return `${n.toFixed(decimals)}%`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength).trimEnd()}…`;
}

// ── IDs ───────────────────────────────────────────────────────────────────────

export function generateShareableSlug(): string {
  return randomBytes(12).toString("base64url");
}

// ── Type guards ───────────────────────────────────────────────────────────────

export function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isDefinedNumber(value: unknown): value is number {
  return typeof value === "number" && !Number.isNaN(value);
}

// ── Async ─────────────────────────────────────────────────────────────────────

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
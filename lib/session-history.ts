/** Browser-local session history — scopes /sessions to this device only. */

const STORAGE_KEY = "reviewlens:session-history";
const MAX_ENTRIES = 50;

export interface TrackedSession {
  slug: string;
  fileName?: string;
  trackedAt: string;
}

function readStore(): TrackedSession[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TrackedSession[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(entries: TrackedSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX_ENTRIES)));
}

/** Record a session after a successful upload from this browser. */
export function trackSession(slug: string, meta?: { fileName?: string }): void {
  const entries = readStore().filter((e) => e.slug !== slug);
  entries.unshift({
    slug,
    fileName: meta?.fileName,
    trackedAt: new Date().toISOString(),
  });
  writeStore(entries);
}

export function getTrackedSlugs(): string[] {
  return readStore().map((e) => e.slug);
}

export function untrackSession(slug: string): void {
  writeStore(readStore().filter((e) => e.slug !== slug));
}

export function getTrackedSessions(): TrackedSession[] {
  return readStore();
}

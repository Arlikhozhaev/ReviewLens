/**
 * Holds a CSV file briefly while navigating from the landing hero
 * to /analyze. Client-side module state — survives remounts until consumed.
 */
let pendingFile: File | null = null;
let pendingConsumed = false;

export function setPendingUpload(file: File): void {
  pendingFile = file;
  pendingConsumed = false;
}

export function consumePendingUpload(): File | null {
  if (pendingConsumed || !pendingFile) return null;
  pendingConsumed = true;
  const file = pendingFile;
  pendingFile = null;
  return file;
}

export function hasPendingUpload(): boolean {
  return pendingFile !== null && !pendingConsumed;
}

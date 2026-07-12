/** Owner-only session access helpers (share viewers use share-access.ts). */

export function isSessionCreator(
  userId: string | undefined,
  session: { userId: string | null }
): boolean {
  return Boolean(userId && session.userId === userId);
}

export function canDeleteSession(
  userId: string,
  session: { userId: string | null }
): boolean {
  return session.userId === userId;
}

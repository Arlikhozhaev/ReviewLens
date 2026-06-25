import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { getAuthSecret } from "@/lib/env";

// Viewer access (after entering a correct password) lasts this long.
const ACCESS_TTL_MS = 12 * 60 * 60 * 1_000; // 12 hours
export const SHARE_ACCESS_TTL_SECONDS = ACCESS_TTL_MS / 1_000;

const SCRYPT_KEYLEN = 64;

// ── Password hashing (scrypt, salted, constant-time compare) ──────────────────

export function hashSharePassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `${salt}:${derived}`;
}

export function verifySharePassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, SCRYPT_KEYLEN);
  return (
    expected.length === actual.length && timingSafeEqual(expected, actual)
  );
}

// ── Expiry ────────────────────────────────────────────────────────────────────

export function isShareExpired(
  shareExpiresAt: Date | null | undefined
): boolean {
  return Boolean(shareExpiresAt && shareExpiresAt.getTime() < Date.now());
}

// ── Signed viewer access token (stored in an httpOnly cookie) ──────────────────

export function shareAccessCookieName(sessionId: string): string {
  return `rl_share_${sessionId}`;
}

function sign(payload: string): string {
  return createHmac("sha256", getAuthSecret()).update(payload).digest("hex");
}

export function issueShareAccessToken(sessionId: string): string {
  const exp = Date.now() + ACCESS_TTL_MS;
  const signature = sign(`${sessionId}.${exp}`);
  return `${exp}.${signature}`;
}

export function verifyShareAccessToken(
  token: string | undefined,
  sessionId: string
): boolean {
  if (!token) return false;
  const [expStr, signature] = token.split(".");
  if (!expStr || !signature) return false;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;

  const expected = sign(`${sessionId}.${exp}`);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

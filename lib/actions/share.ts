"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth-helpers";
import { createLogger } from "@/lib/logger";
import {
  hashSharePassword,
  verifySharePassword,
  issueShareAccessToken,
  shareAccessCookieName,
  isShareExpired,
  SHARE_ACCESS_TTL_SECONDS,
} from "@/lib/share-access";

export interface ShareSettingsResult {
  ok?: boolean;
  error?: string;
}

export interface UpdateShareSettingsInput {
  sessionId: string;
  // undefined = leave unchanged, null/"" = clear, string = set new password
  password?: string | null;
  // undefined = leave unchanged, null = never expire, number = days from now
  expiresInDays?: number | null;
}

export async function updateShareSettings(
  input: UpdateShareSettingsInput
): Promise<ShareSettingsResult> {
  const authUser = await requireAuthUser();
  if (!authUser) return { error: "Sign in required" };

  const session = await prisma.analysisSession.findUnique({
    where: { id: input.sessionId },
    select: { userId: true, shareableSlug: true },
  });

  if (!session) return { error: "Analysis not found" };
  if (session.userId !== authUser.userId) return { error: "Forbidden" };

  const data: {
    sharePasswordHash?: string | null;
    shareExpiresAt?: Date | null;
  } = {};

  if (input.password !== undefined) {
    data.sharePasswordHash = input.password
      ? hashSharePassword(input.password)
      : null;
  }

  if (input.expiresInDays !== undefined) {
    data.shareExpiresAt =
      input.expiresInDays && input.expiresInDays > 0
        ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1_000)
        : null;
  }

  try {
    await prisma.analysisSession.update({
      where: { id: input.sessionId },
      data,
    });
    revalidatePath(`/dashboard/${session.shareableSlug}`);
    return { ok: true };
  } catch (error) {
    createLogger({
      userId: authUser.userId,
      sessionId: input.sessionId,
      component: "update-share-settings",
    }).error("Failed to update share settings", { error: String(error) });
    return { error: "Failed to update share settings" };
  }
}

export async function unlockShare(
  slug: string,
  password: string
): Promise<ShareSettingsResult> {
  const session = await prisma.analysisSession.findUnique({
    where: { shareableSlug: slug },
    select: { id: true, sharePasswordHash: true, shareExpiresAt: true },
  });

  if (!session) return { error: "Analysis not found" };
  if (isShareExpired(session.shareExpiresAt)) {
    return { error: "This link has expired." };
  }
  if (!session.sharePasswordHash) return { ok: true };

  if (!verifySharePassword(password, session.sharePasswordHash)) {
    return { error: "Incorrect password." };
  }

  const cookieStore = cookies();
  cookieStore.set(
    shareAccessCookieName(session.id),
    issueShareAccessToken(session.id),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SHARE_ACCESS_TTL_SECONDS,
    }
  );

  return { ok: true };
}

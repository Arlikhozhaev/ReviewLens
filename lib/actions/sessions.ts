"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAuthUser } from "@/lib/auth-helpers";
import { canDeleteSession } from "@/lib/session-access";
import { createLogger } from "@/lib/logger";

export async function deleteSession(
  sessionId: string
): Promise<{ error?: string }> {
  const authUser = await requireAuthUser();
  if (!authUser) {
    return { error: "Sign in required" };
  }

  const log = createLogger({
    userId: authUser.userId,
    sessionId,
    component: "delete-session",
  });

  try {
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      select: { userId: true },
    });

    if (!session) {
      return { error: "Session not found" };
    }

    const allowed = canDeleteSession(authUser.userId, session);
    if (!allowed) {
      log.warn("Forbidden delete attempt");
      return { error: "Forbidden" };
    }

    await prisma.analysisSession.delete({
      where: { id: sessionId },
    });

    revalidatePath("/sessions");
    log.info("Session deleted");
    return {};
  } catch (error) {
    log.error("Delete failed", { error: String(error) });
    return { error: "Failed to delete session" };
  }
}

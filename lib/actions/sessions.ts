"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function deleteSession(
  sessionId: string
): Promise<{ error?: string }> {
  try {
    // Cascade deletes all Reviews and AnalysisResult via schema relations
    await prisma.analysisSession.delete({
      where: { id: sessionId },
    });
    revalidatePath("/sessions");
    return {};
  } catch (error) {
    console.error("[deleteSession]", error);
    return { error: "Failed to delete session" };
  }
}
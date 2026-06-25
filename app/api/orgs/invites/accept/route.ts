import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireAuthUser,
  unauthorizedResponse,
} from "@/lib/auth-helpers";
import { createLogger } from "@/lib/logger";

const acceptSchema = z.object({
  token: z.string().min(1),
});

export async function POST(request: Request) {
  const authUser = await requireAuthUser();
  if (!authUser) return unauthorizedResponse();

  const log = createLogger({
    userId: authUser.userId,
    component: "accept-org-invite",
  });

  try {
    const body: unknown = await request.json();
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, error: "Invalid invite" },
        { status: 400 }
      );
    }

    const invite = await prisma.organizationInvite.findUnique({
      where: { token: parsed.data.token },
      include: { organization: { select: { id: true, name: true, slug: true } } },
    });

    if (!invite || invite.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false as const, error: "Invite expired or not found" },
        { status: 404 }
      );
    }

    const userEmail = authUser.session.user?.email?.toLowerCase();
    if (!userEmail || userEmail !== invite.email.toLowerCase()) {
      return NextResponse.json(
        {
          success: false as const,
          error: "Sign in with the invited email address to accept",
        },
        { status: 403 }
      );
    }

    await prisma.$transaction([
      prisma.organizationMember.upsert({
        where: {
          organizationId_userId: {
            organizationId: invite.organizationId,
            userId: authUser.userId,
          },
        },
        create: {
          organizationId: invite.organizationId,
          userId: authUser.userId,
          role: invite.role,
        },
        update: {},
      }),
      prisma.organizationInvite.delete({ where: { id: invite.id } }),
    ]);

    log.info("Invite accepted", {
      orgId: invite.organizationId,
      userId: authUser.userId,
    });

    return NextResponse.json({
      success: true as const,
      data: {
        slug: invite.organization.slug,
        name: invite.organization.name,
      },
    });
  } catch (error) {
    log.error("Accept invite failed", { error: String(error) });
    return NextResponse.json(
      { success: false as const, error: "Failed to accept invite" },
      { status: 500 }
    );
  }
}

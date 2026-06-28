import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { env } from "@/lib/env";
import {
  requireAuthUser,
  unauthorizedResponse,
} from "@/lib/auth-helpers";
import { createLogger } from "@/lib/logger";
import { getMembership, requireOrgRole } from "@/lib/org/access";
import { getAppUrl, sendTeamInviteEmail } from "@/lib/email/team-invite";
import type { ApiResponse } from "@/types";

interface RouteContext {
  params: { slug: string };
}

export async function GET(
  _request: Request,
  { params }: RouteContext
): Promise<NextResponse<ApiResponse<{ org: unknown }>>> {
  const authUser = await requireAuthUser();
  if (!authUser) return unauthorizedResponse();

  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
      invites: {
        where: { expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { sessions: true } },
    },
  });

  if (!org) {
    return NextResponse.json(
      { success: false as const, error: "Workspace not found" },
      { status: 404 }
    );
  }

  const membership = await getMembership(authUser.userId, org.id);
  if (!membership) {
    return NextResponse.json(
      { success: false as const, error: "Forbidden" },
      { status: 403 }
    );
  }

  return NextResponse.json({
    success: true as const,
    data: {
      org: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        plan: org.plan,
        role: membership.role,
        sessionCount: org._count.sessions,
        members: org.members.map((m) => ({
          id: m.id,
          role: m.role,
          joinedAt: m.joinedAt.toISOString(),
          user: m.user,
        })),
        pendingInvites: org.invites.map((i) => ({
          id: i.id,
          email: i.email,
          role: i.role,
          expiresAt: i.expiresAt.toISOString(),
        })),
      },
    },
  });
}

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export async function POST(
  request: Request,
  { params }: RouteContext
): Promise<
  NextResponse<
    ApiResponse<{
      inviteUrl: string;
      emailSent: boolean;
      emailError?: string;
    }>
  >
> {
  const authUser = await requireAuthUser();
  if (!authUser) return unauthorizedResponse();

  const log = createLogger({
    userId: authUser.userId,
    component: "org-invite",
  });

  const org = await prisma.organization.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!org) {
    return NextResponse.json(
      { success: false as const, error: "Workspace not found" },
      { status: 404 }
    );
  }

  const membership = await requireOrgRole(authUser.userId, org.id, "ADMIN");
  if (!membership) {
    return NextResponse.json(
      { success: false as const, error: "Forbidden" },
      { status: 403 }
    );
  }

  try {
    const body: unknown = await request.json();
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, error: "Invalid email" },
        { status: 400 }
      );
    }

    const email = parsed.data.email.toLowerCase();
    const existingMember = await prisma.organizationMember.findFirst({
      where: {
        organizationId: org.id,
        user: { email: { equals: email, mode: "insensitive" } },
      },
    });
    if (existingMember) {
      return NextResponse.json(
        { success: false as const, error: "That user is already a member" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1_000);
    let invite;
    try {
      invite = await prisma.organizationInvite.upsert({
        where: {
          organizationId_email: { organizationId: org.id, email },
        },
        create: {
          organizationId: org.id,
          email,
          role: parsed.data.role,
          expiresAt,
          invitedById: authUser.userId,
        },
        update: {
          role: parsed.data.role,
          expiresAt,
          invitedById: authUser.userId,
          token: randomUUID(),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2021" || error.code === "P2022")
      ) {
        log.error("Invite table missing", { error: error.message });
        return NextResponse.json(
          {
            success: false as const,
            error:
              "Team invites are not set up on this database. Run prisma migrate deploy.",
          },
          { status: 503 }
        );
      }
      throw error;
    }

    const inviteUrl = `${getAppUrl()}/team/invite/${invite.token}`;

    const orgMeta = await prisma.organization.findUnique({
      where: { id: org.id },
      select: { name: true },
    });

    const emailResult = await sendTeamInviteEmail({
      to: email,
      inviteUrl,
      orgName: orgMeta?.name ?? "your team",
      inviterName: authUser.session.user?.name ?? authUser.session.user?.email,
    });

    log.info("Invite created", {
      orgId: org.id,
      email,
      emailSent: emailResult.emailSent,
      emailError: emailResult.emailError,
    });

    return NextResponse.json({
      success: true as const,
      data: {
        inviteUrl,
        emailSent: emailResult.emailSent,
        ...(emailResult.emailError
          ? { emailError: emailResult.emailError }
          : {}),
      },
    });
  } catch (error) {
    log.error("Invite failed", { error: String(error) });
    const detail =
      env.NODE_ENV === "development" && error instanceof Error
        ? error.message
        : undefined;
    return NextResponse.json(
      {
        success: false as const,
        error: detail ?? "Failed to create invite",
      },
      { status: 500 }
    );
  }
}

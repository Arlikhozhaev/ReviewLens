import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  requireAuthUser,
  unauthorizedResponse,
} from "@/lib/auth-helpers";
import { createLogger } from "@/lib/logger";
import {
  generateUniqueOrgSlug,
  listUserOrganizations,
} from "@/lib/org/access";
import type { ApiResponse } from "@/types";

export interface OrgSummary {
  id: string;
  name: string;
  slug: string;
  plan: string;
  role: string;
  memberCount: number;
  sessionCount: number;
}

const createOrgSchema = z.object({
  name: z.string().trim().min(2).max(80),
});

export async function GET(): Promise<NextResponse<ApiResponse<{ orgs: OrgSummary[] }>>> {
  const authUser = await requireAuthUser();
  if (!authUser) return unauthorizedResponse();

  const memberships = await listUserOrganizations(authUser.userId);
  const orgs: OrgSummary[] = memberships.map((m) => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    plan: m.organization.plan,
    role: m.role,
    memberCount: m.organization._count.members,
    sessionCount: m.organization._count.sessions,
  }));

  return NextResponse.json({ success: true as const, data: { orgs } });
}

export async function POST(
  request: Request
): Promise<NextResponse<ApiResponse<{ org: OrgSummary }>>> {
  const authUser = await requireAuthUser();
  if (!authUser) return unauthorizedResponse();

  const log = createLogger({
    userId: authUser.userId,
    component: "create-org",
  });

  try {
    const body: unknown = await request.json();
    const parsed = createOrgSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false as const, error: "Invalid workspace name" },
        { status: 400 }
      );
    }

    const slug = await generateUniqueOrgSlug(parsed.data.name);

    const org = await prisma.organization.create({
      data: {
        name: parsed.data.name,
        slug,
        members: {
          create: {
            userId: authUser.userId,
            role: "OWNER",
          },
        },
      },
      include: {
        _count: { select: { members: true, sessions: true } },
      },
    });

    log.info("Organization created", { orgId: org.id, slug });

    return NextResponse.json({
      success: true as const,
      data: {
        org: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          plan: org.plan,
          role: "OWNER",
          memberCount: org._count.members,
          sessionCount: org._count.sessions,
        },
      },
    });
  } catch (error) {
    log.error("Failed to create organization", { error: String(error) });
    return NextResponse.json(
      { success: false as const, error: "Failed to create workspace" },
      { status: 500 }
    );
  }
}

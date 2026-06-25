import type { OrgRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ROLE_RANK: Record<OrgRole, number> = {
  MEMBER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function slugifyOrgName(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "team";
}

export async function generateUniqueOrgSlug(name: string): Promise<string> {
  const base = slugifyOrgName(name);
  for (let i = 0; i < 5; i++) {
    const suffix = i === 0 ? "" : `-${Math.random().toString(36).slice(2, 6)}`;
    const slug = `${base}${suffix}`;
    const existing = await prisma.organization.findUnique({ where: { slug } });
    if (!existing) return slug;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function getMembership(userId: string, organizationId: string) {
  return prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: { organizationId, userId },
    },
  });
}

export async function requireOrgRole(
  userId: string,
  organizationId: string,
  minRole: OrgRole
) {
  const membership = await getMembership(userId, organizationId);
  if (!membership) return null;
  if (ROLE_RANK[membership.role] < ROLE_RANK[minRole]) return null;
  return membership;
}

export async function canViewSession(
  userId: string | undefined,
  session: { userId: string | null; organizationId: string | null }
): Promise<boolean> {
  if (!userId) return false;
  if (session.userId === userId) return true;
  if (!session.organizationId) return false;
  const membership = await getMembership(userId, session.organizationId);
  return Boolean(membership);
}

export function isSessionCreator(
  userId: string | undefined,
  session: { userId: string | null }
): boolean {
  return Boolean(userId && session.userId === userId);
}

export async function canDeleteSession(
  userId: string,
  session: { userId: string | null; organizationId: string | null }
): Promise<boolean> {
  if (session.userId === userId) return true;
  if (!session.organizationId) return false;
  const membership = await requireOrgRole(userId, session.organizationId, "ADMIN");
  return Boolean(membership);
}

export async function listUserOrganizations(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          _count: { select: { members: true, sessions: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
}

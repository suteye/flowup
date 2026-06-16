import { cache } from "react";
import type { Prisma } from "@/generated/prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const getCurrentUser = cache(async () => {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
});

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Response("Unauthorized", { status: 401 });
  return user;
}

export async function getFirstWorkspaceSlug(userId: string) {
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.workspace.slug ?? null;
}

export async function requireMembership(workspaceId: string, userId: string) {
  const membership = await prisma.workspaceMember.findUnique({
    where: { userId_workspaceId: { userId, workspaceId } },
  });
  if (!membership) throw new Response("Forbidden", { status: 403 });
  return membership;
}

export async function requireMembershipBySlug(slug: string, userId: string) {
  const workspace = await prisma.workspace.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId },
      },
    },
  });
  if (!workspace || workspace.members.length === 0) {
    throw new Response("Forbidden", { status: 403 });
  }
  return { workspace, membership: workspace.members[0] };
}

export function visibleSpaceWhere(userId: string): Prisma.SpaceWhereInput {
  return {
    OR: [
      { visibility: "PUBLIC" },
      { ownerId: userId },
      { viewers: { some: { userId } } },
    ],
  };
}

export async function requireVisibleSpace(spaceId: string, userId: string) {
  const space = await prisma.space.findFirst({
    where: {
      id: spaceId,
      ...visibleSpaceWhere(userId),
    },
  });
  if (!space) throw new Response("Space not found", { status: 404 });
  await requireMembership(space.workspaceId, userId);
  return space;
}

import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { prisma } from "@/lib/prisma";
import { requireMembershipBySlug, requireUser, visibleSpaceWhere } from "@/lib/workspace";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await requireUser().catch(() => null);
  if (!user) redirect("/login");

  const { workspace, membership } = await requireMembershipBySlug(
    (await params).workspaceSlug,
    user.id,
  ).catch(() => redirect("/onboarding"));

  const spaces = await prisma.space.findMany({
    where: { workspaceId: workspace.id, ...visibleSpaceWhere(user.id) },
    include: { _count: { select: { tasks: true } }, viewers: true },
    orderBy: { createdAt: "asc" },
  });
  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      displayName: true,
      email: true,
      avatarTone: true,
      avatarAccent: true,
    },
  });

  return (
    <AppShell
      workspace={{
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        icon: workspace.icon,
        color: workspace.color,
        role: membership.role,
      }}
      user={{
        name: profile?.name ?? user.name,
        displayName: profile?.displayName ?? null,
        email: profile?.email ?? user.email,
        avatarTone: profile?.avatarTone ?? "orange",
        avatarAccent: profile?.avatarAccent ?? "#8B6CF6",
      }}
      spaces={spaces.map((space) => ({
        id: space.id,
        name: space.name,
        key: space.key,
        description: space.description,
        color: space.color,
        visibility: space.visibility,
        ownerId: space.ownerId,
        viewerIds: space.viewers.map((viewer) => viewer.userId),
        taskCount: space._count.tasks,
      }))}
    >
      {children}
    </AppShell>
  );
}

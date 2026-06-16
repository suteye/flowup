import { notFound } from "next/navigation";
import { TaskManager } from "@/components/task-manager";
import { prisma } from "@/lib/prisma";
import { requireMembershipBySlug, requireUser, visibleSpaceWhere } from "@/lib/workspace";

export default async function SpacePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; spaceId: string }>;
}) {
  const user = await requireUser();
  const { workspaceSlug, spaceId } = await params;
  const { workspace } = await requireMembershipBySlug(workspaceSlug, user.id);
  const space = await prisma.space.findFirst({
    where: { id: spaceId, workspaceId: workspace.id, ...visibleSpaceWhere(user.id) },
  });

  if (!space) notFound();

  return (
    <TaskManager
      workspaceId={workspace.id}
      spaceId={space.id}
      spaceName={space.name}
      spaceKey={space.key}
      spaceColor={space.color}
    />
  );
}

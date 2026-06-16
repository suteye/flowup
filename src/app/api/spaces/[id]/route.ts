import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { spaceUpdateSchema } from "@/lib/schemas";
import { requireMembership, requireUser, requireVisibleSpace } from "@/lib/workspace";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const input = spaceUpdateSchema.parse({ ...(await request.json()), id });
    const existing = await requireVisibleSpace(id, user.id);
    await requireMembership(existing.workspaceId, user.id);

    if (input.viewerIds) {
      await assertWorkspaceViewers(existing.workspaceId, input.viewerIds);
    }

    const visibility = input.visibility ?? existing.visibility;
    const viewerIds = input.viewerIds ?? [];
    const space = await prisma.$transaction(async (tx) => {
      if (input.viewerIds || input.visibility) {
        await tx.spaceViewer.deleteMany({ where: { spaceId: id } });
        if (visibility === "SELECTED") {
          await tx.spaceViewer.createMany({
            data: normalizeViewerIds(viewerIds, existing.ownerId ?? user.id).map((userId) => ({
              spaceId: id,
              userId,
            })),
            skipDuplicates: true,
          });
        }
      }

      return tx.space.update({
        where: { id },
        data: {
          name: input.name,
          key: input.key,
          description: input.description,
          color: input.color,
          visibility,
        },
        include: { _count: { select: { tasks: true } }, viewers: true },
      });
    });

    return ok({
      space: {
        id: space.id,
        name: space.name,
        key: space.key,
        description: space.description,
        color: space.color,
        visibility: space.visibility,
        ownerId: space.ownerId,
        viewerIds: space.viewers.map((viewer) => viewer.userId),
        taskCount: space._count.tasks,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const existing = await requireVisibleSpace(id, user.id);
    await requireMembership(existing.workspaceId, user.id);
    await prisma.space.delete({ where: { id } });
    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

function normalizeViewerIds(viewerIds: string[], ownerId: string) {
  return Array.from(new Set([...viewerIds, ownerId])).filter(Boolean);
}

async function assertWorkspaceViewers(workspaceId: string, viewerIds: string[]) {
  if (viewerIds.length === 0) return;
  const count = await prisma.workspaceMember.count({
    where: { workspaceId, userId: { in: viewerIds } },
  });
  if (count !== new Set(viewerIds).size) {
    throw new Response("Some selected viewers are not workspace members", { status: 422 });
  }
}

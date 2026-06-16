import { created, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { spaceSchema } from "@/lib/schemas";
import { requireMembership, requireUser, visibleSpaceWhere } from "@/lib/workspace";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");
    if (!workspaceId) return ok({ spaces: [] });

    await requireMembership(workspaceId, user.id);
    const spaces = await prisma.space.findMany({
      where: { workspaceId, ...visibleSpaceWhere(user.id) },
      include: { _count: { select: { tasks: true } }, viewers: true },
      orderBy: { createdAt: "asc" },
    });

    return ok({
      spaces: spaces.map((space) => ({
        id: space.id,
        name: space.name,
        key: space.key,
        description: space.description,
        color: space.color,
        visibility: space.visibility,
        ownerId: space.ownerId,
        viewerIds: space.viewers.map((viewer) => viewer.userId),
        taskCount: space._count.tasks,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = spaceSchema.parse(await request.json());
    await requireMembership(input.workspaceId, user.id);
    await assertWorkspaceViewers(input.workspaceId, input.viewerIds);

    const space = await prisma.space.create({
      data: {
        workspaceId: input.workspaceId,
        ownerId: user.id,
        name: input.name,
        key: input.key,
        description: input.description || null,
        color: input.color || "oklch(0.68 0.16 72)",
        visibility: input.visibility,
        viewers:
          input.visibility === "SELECTED"
            ? {
                create: normalizeViewerIds(input.viewerIds, user.id).map((userId) => ({
                  userId,
                })),
              }
            : undefined,
      },
      include: { _count: { select: { tasks: true } }, viewers: true },
    });

    return created({
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

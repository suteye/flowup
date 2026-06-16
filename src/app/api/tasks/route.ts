import { created, handleApiError, ok } from "@/lib/api-response";
import { buildTaskMessage, sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { taskSchema } from "@/lib/schemas";
import { requireMembership, requireUser, requireVisibleSpace } from "@/lib/workspace";

const taskInclude = {
  creator: { select: { id: true, name: true, image: true } },
  assignments: {
    include: { user: { select: { id: true, name: true, image: true } } },
  },
  subtasks: { select: { id: true, title: true, status: true } },
};

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const spaceId = searchParams.get("spaceId");
    if (!spaceId) return ok({ tasks: [] });

    const space = await requireVisibleSpace(spaceId, user.id);
    await requireMembership(space.workspaceId, user.id);

    const tasks = await prisma.task.findMany({
      where: { spaceId, parentTaskId: null },
      include: taskInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });

    return ok({ tasks });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = taskSchema.parse(await request.json());
    const space = await requireVisibleSpace(input.spaceId, user.id);
    await requireMembership(space.workspaceId, user.id);

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description || null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        spaceId: input.spaceId,
        creatorId: user.id,
        parentTaskId: input.parentTaskId,
        assignments: {
          create: input.assigneeIds.map((userId) => ({ userId })),
        },
        activities: {
          create: {
            action: "created",
            userId: user.id,
            metadata: { status: input.status, priority: input.priority },
          },
        },
      },
      include: taskInclude,
    });

    if (input.assigneeIds.length > 0 || input.dueDate) {
      void notifyWorkspace(
        space.workspaceId,
        buildTaskMessage({
          action: "created",
          spaceName: space.name,
          taskTitle: input.title,
          priority: input.priority,
          assigneeCount: input.assigneeIds.length,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
      );
    }

    return created({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

async function notifyWorkspace(workspaceId: string, message: string) {
  const integrations = await prisma.notificationIntegration.findMany({
    where: { workspaceId, enabled: true },
  });

  await Promise.allSettled(
    integrations.map((integration) =>
      sendNotification({
        provider: integration.provider,
        label: integration.label,
        config: integration.config as Record<string, unknown>,
        token: integration.secretRef,
        message,
      }),
    ),
  );
}

import { handleApiError, ok } from "@/lib/api-response";
import { buildTaskMessage, sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { taskUpdateSchema } from "@/lib/schemas";
import { requireMembership, requireUser, requireVisibleSpace } from "@/lib/workspace";

const taskInclude = {
  creator: { select: { id: true, name: true, image: true } },
  assignments: {
    include: { user: { select: { id: true, name: true, image: true } } },
  },
  subtasks: { select: { id: true, title: true, status: true } },
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const body = await request.json();
    const input = taskUpdateSchema.parse({ ...body, id });
    const hasAssigneeIds = Object.prototype.hasOwnProperty.call(body, "assigneeIds");
    const hasDueDate = Object.prototype.hasOwnProperty.call(body, "dueDate");
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { space: true },
    });
    if (!existing) throw new Response("Task not found", { status: 404 });
    await requireVisibleSpace(existing.spaceId, user.id);
    await requireMembership(existing.space.workspaceId, user.id);

    const task = await prisma.$transaction(async (tx) => {
      if (hasAssigneeIds) {
        await tx.taskAssignment.deleteMany({ where: { taskId: id } });
        await tx.taskAssignment.createMany({
          data: (input.assigneeIds ?? []).map((userId) => ({ taskId: id, userId })),
          skipDuplicates: true,
        });
      }

      await tx.taskActivity.create({
        data: {
          taskId: id,
          userId: user.id,
          action: "updated",
          metadata: input,
        },
      });

      return tx.task.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          status: input.status,
          priority: input.priority,
          dueDate: hasDueDate ? (input.dueDate ? new Date(input.dueDate) : null) : undefined,
        },
        include: taskInclude,
      });
    });

    if (hasAssigneeIds || hasDueDate) {
      void notifyWorkspace(
        existing.space.workspaceId,
        buildTaskMessage({
          action: "updated",
          spaceName: existing.space.name,
          taskTitle: task.title,
          priority: task.priority,
          assigneeCount: task.assignments.length,
          dueDate: task.dueDate,
        }),
      );
    }

    return ok({ task });
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
    const existing = await prisma.task.findUnique({
      where: { id },
      include: { space: true },
    });
    if (!existing) throw new Response("Task not found", { status: 404 });
    await requireVisibleSpace(existing.spaceId, user.id);
    await requireMembership(existing.space.workspaceId, user.id);
    await prisma.task.delete({ where: { id } });
    return ok({ ok: true });
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

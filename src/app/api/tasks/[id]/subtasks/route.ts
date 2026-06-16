import { created, handleApiError } from "@/lib/api-response";
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const parent = await prisma.task.findUnique({
      where: { id },
      include: { space: true },
    });
    if (!parent) throw new Response("Task not found", { status: 404 });
    await requireVisibleSpace(parent.spaceId, user.id);
    await requireMembership(parent.space.workspaceId, user.id);

    const input = taskSchema.parse({
      ...(await request.json()),
      spaceId: parent.spaceId,
      parentTaskId: id,
    });

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description || null,
        status: input.status,
        priority: input.priority,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
        spaceId: parent.spaceId,
        parentTaskId: id,
        creatorId: user.id,
        assignments: {
          create: input.assigneeIds.map((userId) => ({ userId })),
        },
        activities: {
          create: { action: "subtask_created", userId: user.id },
        },
      },
      include: taskInclude,
    });

    return created({ task });
  } catch (error) {
    return handleApiError(error);
  }
}

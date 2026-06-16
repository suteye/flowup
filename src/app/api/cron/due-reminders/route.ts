import { handleApiError, ok } from "@/lib/api-response";
import { buildTaskMessage, sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const secret = request.headers.get("x-cron-secret");
    if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
      return new Response("Unauthorized", { status: 401 });
    }

    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { lte: in24h },
        status: { not: "DONE" },
      },
      include: {
        space: {
          include: {
            workspace: {
              include: {
                notificationIntegrations: { where: { enabled: true } },
              },
            },
          },
        },
        assignments: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
    });

    const sends = tasks.flatMap((task) =>
      task.space.workspace.notificationIntegrations.map((integration) =>
        sendNotification({
          provider: integration.provider,
          label: integration.label,
          config: integration.config as Record<string, unknown>,
          token: integration.secretRef,
          message:
            (task.dueDate && task.dueDate < now
              ? `🔴 <b>เกินกำหนดแล้ว!</b>\n`
              : `⏰ <b>ใกล้ครบกำหนด!</b>\n`) +
            buildTaskMessage({
              action: "updated",
              spaceName: task.space.name,
              taskTitle: task.title,
              priority: task.priority,
              assigneeCount: task.assignments.length,
              dueDate: task.dueDate,
            }),
        }),
      ),
    );

    await Promise.allSettled(sends);
    return ok({ notified: tasks.length, sent: sends.length });
  } catch (error) {
    return handleApiError(error);
  }
}

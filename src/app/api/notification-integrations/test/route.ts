import { handleApiError, ok } from "@/lib/api-response";
import { sendNotification } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import { notificationIntegrationSchema } from "@/lib/schemas";
import { requireMembership, requireUser } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = notificationIntegrationSchema.parse(await request.json());
    await requireMembership(input.workspaceId, user.id);

    const integration = await prisma.notificationIntegration.upsert({
      where: {
        workspaceId_provider: {
          workspaceId: input.workspaceId,
          provider: input.provider,
        },
      },
      create: {
        workspaceId: input.workspaceId,
        provider: input.provider,
        label: input.label,
        enabled: input.enabled,
        config: input.config,
        secretRef: input.token || null,
      },
      update: {
        label: input.label,
        enabled: input.enabled,
        config: input.config,
        secretRef: input.token || undefined,
      },
    });

    const result = await sendNotification({
      provider: integration.provider,
      label: integration.label,
      config: integration.config as Record<string, unknown>,
      token: integration.secretRef,
      message: "Pixel Cat Office test notification",
    });

    return ok({ integration, result });
  } catch (error) {
    return handleApiError(error);
  }
}

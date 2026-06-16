import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { profileOnboardingSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/workspace";

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const input = profileOnboardingSchema.parse(await request.json());
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: input.displayName,
        name: input.displayName,
        avatarTone: input.avatarTone,
        avatarAccent: input.avatarAccent,
      },
      select: {
        id: true,
        name: true,
        displayName: true,
        avatarTone: true,
        avatarAccent: true,
      },
    });

    return ok({ user: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

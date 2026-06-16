import { nanoid } from "nanoid";
import { addDays } from "date-fns";
import { created, handleApiError, ok } from "@/lib/api-response";
import { canInvite } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { inviteCreateSchema } from "@/lib/schemas";
import { requireMembership, requireUser } from "@/lib/workspace";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await requireMembership(id, user.id);
    const invites = await prisma.invite.findMany({
      where: { workspaceId: id },
      orderBy: { createdAt: "desc" },
    });
    return ok({ invites });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const membership = await requireMembership(id, user.id);
    if (!canInvite(membership.role)) throw new Response("Forbidden", { status: 403 });
    const input = inviteCreateSchema.parse(await request.json());

    const invite = await prisma.invite.create({
      data: {
        token: nanoid(32),
        email: input.email || null,
        role: input.role,
        workspaceId: id,
        createdById: user.id,
        expiresAt: addDays(new Date(), 14),
      },
    });

    return created({ invite });
  } catch (error) {
    return handleApiError(error);
  }
}

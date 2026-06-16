import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { workspaceMemberRemoveSchema, workspaceMemberRoleSchema } from "@/lib/schemas";
import { requireMembership, requireUser } from "@/lib/workspace";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    await requireMembership(id, user.id);
    const members = await prisma.workspaceMember.findMany({
      where: { workspaceId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            avatarTone: true,
            avatarAccent: true,
          },
        },
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
    });
    return ok({ members });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const actor = await requireMembership(id, user.id);
    if (actor.role !== "OWNER") throw new Response("Only workspace owners can change roles", { status: 403 });

    const input = workspaceMemberRoleSchema.parse(await request.json());
    const target = await prisma.workspaceMember.findFirst({
      where: { id: input.memberId, workspaceId: id },
    });
    if (!target) throw new Response("Member not found", { status: 404 });

    if (target.role === "OWNER" && input.role !== "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId: id, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        throw new Response("Workspace must keep at least one owner", { status: 422 });
      }
    }

    const member = await prisma.workspaceMember.update({
      where: { id: input.memberId },
      data: { role: input.role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            displayName: true,
            email: true,
            image: true,
            avatarTone: true,
            avatarAccent: true,
          },
        },
      },
    });
    return ok({ member });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();
    const { id } = await context.params;
    const actor = await requireMembership(id, user.id);
    if (actor.role !== "OWNER") throw new Response("Only workspace owners can remove members", { status: 403 });

    const input = workspaceMemberRemoveSchema.parse(await request.json());
    const target = await prisma.workspaceMember.findFirst({
      where: { id: input.memberId, workspaceId: id },
    });
    if (!target) throw new Response("Member not found", { status: 404 });
    if (target.userId === user.id) throw new Response("You cannot remove yourself from this workspace", { status: 422 });

    if (target.role === "OWNER") {
      const ownerCount = await prisma.workspaceMember.count({
        where: { workspaceId: id, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        throw new Response("Workspace must keep at least one owner", { status: 422 });
      }
    }

    await prisma.$transaction(async (tx) => {
      await tx.taskAssignment.deleteMany({
        where: {
          userId: target.userId,
          task: { space: { workspaceId: id } },
        },
      });
      await tx.spaceViewer.deleteMany({
        where: {
          userId: target.userId,
          space: { workspaceId: id },
        },
      });
      await tx.space.updateMany({
        where: { workspaceId: id, ownerId: target.userId },
        data: { ownerId: user.id },
      });
      await tx.workspaceMember.delete({ where: { id: target.id } });
    });

    return ok({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}

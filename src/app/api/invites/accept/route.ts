import { handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { inviteAcceptSchema } from "@/lib/schemas";
import { requireUser } from "@/lib/workspace";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = inviteAcceptSchema.parse(await request.json());
    const token = extractInviteToken(input.token);
    const invite = await prisma.invite.findUnique({
      where: { token },
      include: { workspace: true },
    });

    if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
      throw new Response("Invite is invalid or expired", { status: 400 });
    }

    await prisma.$transaction([
      prisma.workspaceMember.upsert({
        where: {
          userId_workspaceId: {
            userId: user.id,
            workspaceId: invite.workspaceId,
          },
        },
        update: {},
        create: {
          userId: user.id,
          workspaceId: invite.workspaceId,
          role: invite.role,
          displayName: user.name,
        },
      }),
      prisma.invite.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", acceptedAt: new Date() },
      }),
    ]);

    return ok({ workspace: invite.workspace });
  } catch (error) {
    return handleApiError(error);
  }
}

function extractInviteToken(value: string) {
  const trimmed = value.trim();
  try {
    const url = new URL(trimmed);
    return url.searchParams.get("invite") ?? url.pathname.split("/").filter(Boolean).at(-1) ?? trimmed;
  } catch {
    return trimmed;
  }
}

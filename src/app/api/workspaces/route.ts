import { nanoid } from "nanoid";
import { created, handleApiError, ok } from "@/lib/api-response";
import { prisma } from "@/lib/prisma";
import { workspaceSchema } from "@/lib/schemas";
import { slugify } from "@/lib/utils";
import { requireUser } from "@/lib/workspace";

export async function GET() {
  try {
    const user = await requireUser();
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: user.id },
      include: { workspace: true },
      orderBy: { createdAt: "asc" },
    });

    return ok({
      workspaces: memberships.map((membership) => ({
        id: membership.workspace.id,
        name: membership.workspace.name,
        slug: membership.workspace.slug,
        description: membership.workspace.description,
        icon: membership.workspace.icon,
        color: membership.workspace.color,
        role: membership.role,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const input = workspaceSchema.parse(await request.json());
    const baseSlug = slugify(input.name) || `workspace-${nanoid(6)}`;
    const slug = await uniqueSlug(baseSlug);

    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        slug,
        description: input.description || null,
        icon: input.icon,
        color: input.color,
        members: {
          create: {
            userId: user.id,
            role: "OWNER",
            displayName: user.name,
          },
        },
      },
    });

    return created({
      workspace: {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        icon: workspace.icon,
        color: workspace.color,
        role: "OWNER",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function uniqueSlug(baseSlug: string) {
  let candidate = baseSlug;
  let count = 1;
  while (await prisma.workspace.findUnique({ where: { slug: candidate } })) {
    count += 1;
    candidate = `${baseSlug}-${count}`;
  }
  return candidate;
}

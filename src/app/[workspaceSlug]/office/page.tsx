import { Map } from "lucide-react";
import { OfficeMap } from "@/components/office-map";
import { prisma } from "@/lib/prisma";
import { requireMembershipBySlug, requireUser, visibleSpaceWhere } from "@/lib/workspace";

const legend = [
  { label: "DEVELOPER", color: "var(--dev)" },
  { label: "SECTION HEAD", color: "var(--head)" },
  { label: "UAT", color: "var(--uat)" },
  { label: "DEPLOY", color: "var(--deploy)" },
];

export default async function OfficePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await requireUser();
  const { workspace } = await requireMembershipBySlug((await params).workspaceSlug, user.id);
  const spaces = await prisma.space.findMany({
    where: { workspaceId: workspace.id, ...visibleSpaceWhere(user.id) },
    include: {
      tasks: { select: { status: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: workspace.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          displayName: true,
          email: true,
          avatarTone: true,
          avatarAccent: true,
        },
      },
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }],
  });

  return (
    <main className="blueprint h-full overflow-y-auto">
      <div className="mx-auto grid max-w-[1080px] gap-4 p-5">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div className="grid gap-1">
            <div className="flex items-center gap-2.5">
              <Map size={20} className="text-primary" />
              <h1 className="text-[23px] font-semibold">ตึก {workspace.name}</h1>
            </div>
            <p className="m-0 text-sm text-muted-foreground">
              แต่ละห้องคือ Space หนึ่ง — คลิกเข้าไปดูงานของห้องนั้นได้เลย
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {legend.map((item) => (
              <span
                key={item.label}
                className="chip"
                style={{
                  color: item.color,
                  borderColor: `color-mix(in srgb, ${item.color} 40%, transparent)`,
                  background: `color-mix(in srgb, ${item.color} 12%, transparent)`,
                }}
              >
                {item.label}
              </span>
            ))}
          </div>
        </header>

        <OfficeMap
          workspaceSlug={workspace.slug}
          members={members.map((member) => ({
            id: member.user.id,
            name: member.user.displayName ?? member.user.name,
            email: member.user.email,
            role: member.role,
            avatarTone: safeCatTone(member.user.avatarTone),
            avatarAccent: member.user.avatarAccent,
          }))}
          spaces={spaces.map((space) => ({
            id: space.id,
            name: space.name,
            key: space.key,
            color: space.color,
            taskCount: space._count.tasks,
            openTaskCount: space.tasks.filter((task) => task.status !== "DONE").length,
          }))}
        />
      </div>
    </main>
  );
}

function safeCatTone(value: string) {
  return ["orange", "gray", "cream", "tux", "blue", "pink"].includes(value)
    ? (value as "orange" | "gray" | "cream" | "tux" | "blue" | "pink")
    : "orange";
}

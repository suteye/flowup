import Image from "next/image";
import Link from "next/link";
import { CalendarClock, Check, Clock, Flag, Folder, Inbox, Map, Sparkles } from "lucide-react";
import { CatAvatar, DueChip, StatusChip } from "@/components/pixel-primitives";
import { prisma } from "@/lib/prisma";
import { requireMembershipBySlug, requireUser, visibleSpaceWhere } from "@/lib/workspace";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await requireUser();
  const { workspace } = await requireMembershipBySlug((await params).workspaceSlug, user.id);
  const [spaces, memberCount, tasks] = await Promise.all([
    prisma.space.findMany({
      where: { workspaceId: workspace.id, ...visibleSpaceWhere(user.id) },
      include: {
        tasks: { select: { status: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.workspaceMember.count({ where: { workspaceId: workspace.id } }),
    prisma.task.findMany({
      where: { space: { workspaceId: workspace.id }, parentTaskId: null },
      include: { space: true, assignments: { include: { user: true } }, subtasks: true },
      orderBy: { updatedAt: "desc" },
      take: 12,
    }),
  ]);

  const nowTime = currentTimestamp();
  const nowDate = new Date(nowTime);
  const openTasks = tasks.filter((task) => task.status !== "DONE");
  const doneTasks = tasks.filter((task) => task.status === "DONE");
  const dueSoon = openTasks
    .filter((task) => task.dueDate && (task.dueDate.getTime() - nowTime) / 86400000 <= 2)
    .sort((a, b) => (a.dueDate?.getTime() ?? 0) - (b.dueDate?.getTime() ?? 0));
  const overdue = openTasks.filter((task) => task.dueDate && task.dueDate < nowDate);
  const firstName = user.name?.split(" ")[0] ?? "เพื่อนร่วมทีม";

  return (
    <main className="blueprint h-full overflow-y-auto p-5">
      <div className="mx-auto grid max-w-[1280px] gap-4">
        <section className="pixel-card anim-rise relative min-h-[150px] overflow-hidden p-0">
          <Image
            src="/assets/pixel-office.png"
            alt=""
            width={1254}
            height={1254}
            className="pixelated absolute -right-8 top-1/2 h-[210%] w-auto -translate-y-1/2 opacity-50 [mask-image:linear-gradient(90deg,transparent,#000_60%)]"
            priority
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface)_30%,transparent)]" />
          <div className="relative flex flex-wrap items-end justify-between gap-4 p-6">
            <div className="grid gap-1.5">
              <span className="chip w-fit border-[var(--brand-2)] bg-[color-mix(in_srgb,var(--brand-2)_12%,transparent)] text-[var(--brand-2)]">
                <span className="h-1.5 w-1.5 rounded-[2px] bg-[var(--brand-2)]" />
                {workspace.name}
              </span>
              <h1 className="text-[28px] font-semibold tracking-normal">
                {greet()}, {firstName}
              </h1>
              <p className="m-0 text-[14.5px] text-muted-foreground">
                วันนี้คุณมีงานที่ต้องดู <b className="text-primary">{openTasks.length}</b> งาน · ใกล้ครบกำหนด{" "}
                <b className="text-[var(--deploy)]">{dueSoon.length}</b> งาน
              </p>
            </div>
            <Link href={`/${workspace.slug}/office`} className="pbtn px-3 py-2 text-sm">
              <Map size={16} />
              เดินดูทั้งตึก
            </Link>
          </div>
        </section>

        <section className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(190px,1fr))]">
          <StatCard icon={<Inbox size={20} />} label="งานทั้งหมด" value={tasks.length} color="var(--brand)" />
          <StatCard icon={<Clock size={20} />} label="กำลังทำ" value={openTasks.filter((task) => task.status === "IN_PROGRESS").length} color="var(--st-prog)" />
          <StatCard icon={<Check size={20} />} label="เสร็จแล้ว" value={doneTasks.length} color="var(--st-done)" />
          <StatCard icon={<Flag size={20} />} label="เลยกำหนด" value={overdue.length} color="var(--pr-urgent)" sub={overdue.length > 0 ? "ต้องรีบ" : undefined} />
        </section>

        <section className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="grid gap-4">
            <Panel title="งานล่าสุด" icon={<Check size={16} />}>
              {openTasks.length ? (
                openTasks.slice(0, 6).map((task) => (
                  <Link
                    key={task.id}
                    href={`/${workspace.slug}/spaces/${task.spaceId}`}
                    className="navitem flex items-center gap-2 px-2.5 py-2"
                  >
                    <span className="grid h-[22px] w-[22px] place-items-center rounded border-2 border-[var(--border-2)]">
                      <Check size={12} className="text-muted-foreground" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                    <DueChip dueDate={task.dueDate} />
                    <span className="h-3 w-3 rounded-[3px]" style={{ background: task.space.color }} />
                  </Link>
                ))
              ) : (
                <EmptyMini text="ไม่มีงานค้าง เยี่ยมมาก" />
              )}
            </Panel>

            <Panel title="ภาพรวมแต่ละ Space" icon={<Folder size={16} />}>
              <div className="grid gap-1 p-1">
                {spaces.map((space) => {
                  const done = space.tasks.filter((task) => task.status === "DONE").length;
                  const pct = space._count.tasks ? done / space._count.tasks : 0;
                  return (
                    <Link
                      key={space.id}
                      href={`/${workspace.slug}/spaces/${space.id}`}
                      className="navitem flex items-center gap-3 p-2.5"
                    >
                      <span
                        className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-md border-2 text-sm"
                        style={{
                          borderColor: space.color,
                          background: `color-mix(in srgb, ${space.color} 20%, var(--surface))`,
                        }}
                      >
                        {space.key.slice(0, 1)}
                      </span>
                      <span className="grid min-w-0 flex-1 gap-1">
                        <span className="flex justify-between gap-2">
                          <span className="truncate text-sm font-semibold">{space.name}</span>
                          <span className="font-tech text-xs text-[var(--faint)]">{done}/{space._count.tasks}</span>
                        </span>
                        <span className="h-2 overflow-hidden rounded-full bg-[var(--surface-3)]">
                          <span
                            className="block h-full rounded-full transition-[width]"
                            style={{ width: `${Math.round(pct * 100)}%`, background: space.color }}
                          />
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </Panel>
          </div>

          <div className="grid gap-4">
            <Panel title="ใกล้ถึงกำหนด" icon={<CalendarClock size={16} />}>
              {dueSoon.length ? (
                dueSoon.slice(0, 5).map((task) => (
                  <Link key={task.id} href={`/${workspace.slug}/spaces/${task.spaceId}`} className="navitem flex items-center gap-2 px-2.5 py-2">
                    <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                    <DueChip dueDate={task.dueDate} />
                  </Link>
                ))
              ) : (
                <EmptyMini text="ยังไม่มีงานใกล้ครบกำหนด" />
              )}
            </Panel>

            <Panel title="ความเคลื่อนไหวล่าสุด" icon={<Sparkles size={16} />}>
              <div className="grid gap-1 p-1">
                {tasks.slice(0, 7).map((task, index) => (
                  <Link
                    key={task.id}
                    href={`/${workspace.slug}/spaces/${task.spaceId}`}
                    className="flex items-start gap-2.5 rounded-md px-2 py-2 hover:bg-[var(--hover)]"
                  >
                    <CatAvatar cat={index % 2 ? "gray" : "orange"} size={28} />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] leading-snug">
                        <b>{task.assignments[0]?.user.name ?? user.name ?? "FlowUp"}</b>{" "}
                        <span className="text-muted-foreground">อัปเดต</span>{" "}
                        <span className="font-semibold" style={{ color: task.space.color }}>{task.title}</span>
                      </span>
                      <span className="text-[11.5px] text-[var(--faint)]">{task.space.name}</span>
                    </span>
                    <span className="ml-auto">
                      <StatusChip status={task.status} />
                    </span>
                  </Link>
                ))}
                {tasks.length === 0 && <EmptyMini text="ยังไม่มีความเคลื่อนไหว" />}
              </div>
            </Panel>

            <div className="pixel-card flex items-center justify-between gap-3 p-4">
              <div>
                <p className="font-tech text-sm font-semibold">{memberCount} สมาชิกในตึกนี้</p>
                <p className="text-xs text-muted-foreground">ชวนทีมเข้าห้องทำงานได้จากหน้า invites</p>
              </div>
              <Link href={`/${workspace.slug}/invites`} className="pbtn px-3 py-2 text-sm">
                เชิญทีม
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function greet() {
  const hour = new Date().getHours();
  if (hour < 12) return "อรุณสวัสดิ์";
  if (hour < 17) return "สวัสดียามบ่าย";
  return "สวัสดียามเย็น";
}

function currentTimestamp() {
  return Date.now();
}

function StatCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="pixel-card flex min-w-0 items-center gap-3 p-3.5">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border-2"
        style={{
          color,
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${color} 40%, transparent)`,
        }}
      >
        {icon}
      </span>
      <span className="grid min-w-0 gap-0">
        <span className="font-pixel text-lg">{value}</span>
        <span className="font-tech truncate text-[12.5px] text-muted-foreground">{label}</span>
      </span>
      {sub && (
        <span
          className="chip ml-auto border-transparent"
          style={{ color, background: `color-mix(in srgb, ${color} 12%, transparent)` }}
        >
          {sub}
        </span>
      )}
    </div>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="pixel-card flex flex-col p-0">
      <div className="flex items-center gap-2 border-b-2 border-[var(--border)] px-4 py-3">
        <span className="text-muted-foreground">{icon}</span>
        <h2 className="text-[15px] font-semibold">{title}</h2>
      </div>
      <div className="p-2">{children}</div>
    </section>
  );
}

function EmptyMini({ text }: { text: string }) {
  return (
    <div className="grid place-items-center gap-2 px-4 py-7 text-center">
      <CatAvatar cat="cream" size={40} />
      <span className="text-[13.5px] text-muted-foreground">{text}</span>
    </div>
  );
}

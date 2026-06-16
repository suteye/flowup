"use client";

import { Calendar, Check, Flag } from "lucide-react";
import { format } from "date-fns";
import { cn, initials } from "@/lib/utils";
import type { TaskSummary } from "@/hooks/use-tasks";

const cats = {
  gray: { fur: "#8C93A8", dark: "#5E6478", belly: "#D8DCE6", pat: "plain" },
  orange: { fur: "#E58A3A", dark: "#A94F22", belly: "#FFE0B5", pat: "tabby" },
  cream: { fur: "#F2D6A2", dark: "#B98F51", belly: "#FFF0D6", pat: "plain" },
  tux: { fur: "#2E3040", dark: "#171925", belly: "#F3F0F6", pat: "patch" },
  blue: { fur: "#6F8DBF", dark: "#3E527E", belly: "#D7E4FF", pat: "plain" },
  pink: { fur: "#E98AB3", dark: "#B94E80", belly: "#FFE3EF", pat: "patch" },
};

export type CatTone = keyof typeof cats;

export function CatAvatar({
  cat = "gray",
  size = 32,
  online,
  title,
  label,
  className,
}: {
  cat?: CatTone;
  size?: number;
  online?: boolean;
  title?: string | null;
  label?: string | null;
  className?: string;
}) {
  const palette = cats[cat] ?? cats.gray;
  const dot = Math.max(7, Math.round(size * 0.26));

  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      title={title ?? label ?? undefined}
    >
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        shapeRendering="crispEdges"
        aria-hidden="true"
      >
        <polygon points="6,2 15,9 6,12" fill={palette.fur} />
        <polygon points="26,2 17,9 26,12" fill={palette.fur} />
        <polygon points="8,4 12,8 8,10" fill={palette.dark} />
        <polygon points="24,4 20,8 24,10" fill={palette.dark} />
        <polygon points="10,7 22,7 26,11 26,22 22,26 10,26 6,22 6,11" fill={palette.fur} />
        {palette.pat === "tabby" && (
          <g fill={palette.dark} opacity="0.85">
            <rect x="15" y="7" width="2" height="5" />
            <rect x="11" y="8" width="1" height="3" />
            <rect x="20" y="8" width="1" height="3" />
          </g>
        )}
        {palette.pat === "patch" && (
          <polygon points="10,7 16,7 16,16 6,16 6,11" fill={palette.dark} opacity="0.92" />
        )}
        <rect x="10" y="17" width="12" height="8" fill={palette.belly} opacity="0.9" />
        <rect x="11" y="14" width="3" height="4" fill="#2A2440" />
        <rect x="18" y="14" width="3" height="4" fill="#2A2440" />
        <rect x="12" y="14" width="1" height="1" fill="#fff" />
        <rect x="19" y="14" width="1" height="1" fill="#fff" />
        <polygon points="15,19 17,19 16,21" fill="#C25B7A" />
        <rect x="6" y="20" width="3" height="1" fill={palette.dark} opacity="0.5" />
        <rect x="23" y="20" width="3" height="1" fill={palette.dark} opacity="0.5" />
      </svg>
      {online !== undefined && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-[2px] border-2 border-[var(--surface)]"
          style={{
            width: dot,
            height: dot,
            background: online ? "var(--st-done)" : "var(--faint)",
          }}
        />
      )}
      {label && (
        <span className="sr-only">
          {label} {online ? "online" : ""}
        </span>
      )}
    </span>
  );
}

export function AvatarStack({
  users,
  size = 26,
  max = 4,
}: {
  users: { id: string; name?: string | null; image?: string | null }[];
  size?: number;
  max?: number;
}) {
  const tones: CatTone[] = ["orange", "gray", "cream", "tux", "blue", "pink"];
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;

  return (
    <span className="flex items-center pl-1">
      {shown.map((user, index) => (
        <span
          key={user.id}
          className="-ml-1.5 rounded-md border-2 border-[var(--surface)] bg-[var(--surface)]"
        >
          <CatAvatar
            cat={tones[index % tones.length]}
            size={size}
            title={user.name ?? initials(user.name)}
          />
        </span>
      ))}
      {extra > 0 && (
        <span
          className="-ml-1.5 grid place-items-center rounded-md border-2 border-[var(--surface)] bg-[var(--surface-3)] text-[11px] font-bold text-muted-foreground"
          style={{ width: size, height: size }}
        >
          +{extra}
        </span>
      )}
    </span>
  );
}

const statusMeta: Record<TaskSummary["status"], { label: string; color: string }> = {
  BACKLOG: { label: "รอจัดคิว", color: "var(--st-todo)" },
  TODO: { label: "รอทำ", color: "var(--st-todo)" },
  IN_PROGRESS: { label: "กำลังทำ", color: "var(--st-prog)" },
  REVIEW: { label: "รอรีวิว", color: "var(--st-review)" },
  DONE: { label: "เสร็จแล้ว", color: "var(--st-done)" },
};

const priorityMeta: Record<TaskSummary["priority"], { label: string; color: string }> = {
  LOW: { label: "ต่ำ", color: "var(--pr-low)" },
  MEDIUM: { label: "ปานกลาง", color: "var(--pr-med)" },
  HIGH: { label: "สูง", color: "var(--pr-high)" },
  URGENT: { label: "ด่วน", color: "var(--pr-urgent)" },
};

export function StatusDot({ status, size = 9 }: { status: TaskSummary["status"]; size?: number }) {
  return (
    <span
      className="inline-block shrink-0 rounded-[2px]"
      style={{ width: size, height: size, background: statusMeta[status].color }}
    />
  );
}

export function StatusChip({ status }: { status: TaskSummary["status"] }) {
  const meta = statusMeta[status];
  return (
    <span
      className="chip"
      style={{
        color: meta.color,
        background: "color-mix(in srgb, currentColor 14%, transparent)",
        borderColor: "color-mix(in srgb, currentColor 32%, transparent)",
      }}
    >
      <StatusDot status={status} />
      {meta.label}
    </span>
  );
}

export function PriorityFlag({
  priority,
  withLabel = false,
}: {
  priority: TaskSummary["priority"];
  withLabel?: boolean;
}) {
  const meta = priorityMeta[priority];
  return (
    <span
      className="chip"
      style={{
        color: meta.color,
        background: "color-mix(in srgb, currentColor 12%, transparent)",
        borderColor: "color-mix(in srgb, currentColor 30%, transparent)",
        padding: withLabel ? "3px 9px" : "3px 6px",
      }}
    >
      <Flag size={12} strokeWidth={2.4} />
      {withLabel && meta.label}
    </span>
  );
}

export function formatDueDate(iso?: string | Date | null) {
  if (!iso) return "—";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Math.round((date.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "วันนี้";
  if (diff === 1) return "พรุ่งนี้";
  if (diff === -1) return "เมื่อวาน";
  return format(date, "d MMM");
}

export function dueTone(iso?: string | Date | null) {
  if (!iso) return "text-muted-foreground";
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const diff = Math.round((date.getTime() - Date.now()) / 86400000);
  if (diff < 0) return "text-[var(--pr-urgent)]";
  if (diff <= 1) return "text-[var(--pr-high)]";
  return "text-muted-foreground";
}

export function DueChip({ dueDate }: { dueDate?: string | Date | null }) {
  if (!dueDate) return null;
  return (
    <span className={cn("chip bg-[var(--surface-2)] text-[11.5px]", dueTone(dueDate))}>
      <Calendar size={12} />
      {formatDueDate(dueDate)}
    </span>
  );
}

export function CheckSquare({ done }: { done: boolean }) {
  return (
    <span
      className="grid h-[18px] w-[18px] place-items-center rounded border-2"
      style={{
        borderColor: done ? "var(--st-done)" : "var(--border-2)",
        background: done ? "var(--st-done)" : "transparent",
      }}
    >
      {done && <Check size={12} className="text-white" />}
    </span>
  );
}

export const taskStatusOrder: TaskSummary["status"][] = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "DONE",
];

export const taskStatusLabels = statusMeta;
export const taskPriorityLabels = priorityMeta;

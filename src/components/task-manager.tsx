"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { CalendarDays, Check, Filter, GanttChart, GripVertical, KanbanSquare, Plus, Save, Table2, Trash2, X } from "lucide-react";
import type { CSSProperties, MouseEvent } from "react";
import { useMemo, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import type { z } from "zod";
import {
  AvatarStack,
  CheckSquare,
  DueChip,
  PriorityFlag,
  StatusChip,
  StatusDot,
  formatDueDate,
  taskPriorityLabels,
  taskStatusLabels,
  taskStatusOrder,
} from "@/components/pixel-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskSchema, type TaskInput, type TaskUpdateInput } from "@/lib/schemas";
import { useMembers } from "@/hooks/use-members";
import {
  useCreateSubtask,
  useCreateTask,
  useDeleteTask,
  useTasks,
  useUpdateTask,
  type TaskSummary,
} from "@/hooks/use-tasks";
import { useUiStore } from "@/stores/ui-store";

const statusOptions: TaskSummary["status"][] = ["TODO", "IN_PROGRESS", "REVIEW", "DONE"];
const priorityOptions: TaskSummary["priority"][] = ["LOW", "MEDIUM", "HIGH", "URGENT"];

export function TaskManager({
  workspaceId,
  spaceId,
  spaceName,
  spaceKey,
  spaceColor,
}: {
  workspaceId: string;
  spaceId: string;
  spaceName: string;
  spaceKey: string;
  spaceColor: string;
}) {
  const viewMode = useUiStore((state) => state.viewMode);
  const setViewMode = useUiStore((state) => state.setViewMode);
  const tasksQuery = useTasks(spaceId);
  const membersQuery = useMembers(workspaceId);
  const createTask = useCreateTask();
  const updateTask = useUpdateTask(spaceId);
  const deleteTask = useDeleteTask(spaceId);
  const createSubtask = useCreateSubtask(spaceId);
  const [subtaskParent, setSubtaskParent] = useState<string | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [assigneeFilter, setAssigneeFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");

  const form = useForm<z.input<typeof taskSchema>, unknown, TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      spaceId,
      title: "",
      description: "",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: "",
      assigneeIds: [],
    },
  });

  async function submitTask(input: TaskInput) {
    // Convert datetime-local string to ISO using browser's local timezone (Bangkok UTC+7)
    const payload: TaskInput = {
      ...input,
      dueDate: input.dueDate ? new Date(input.dueDate).toISOString() : input.dueDate,
    };
    if (subtaskParent) {
      await createSubtask.mutateAsync({ ...payload, taskId: subtaskParent });
      setSubtaskParent(null);
    } else {
      await createTask.mutateAsync(payload);
    }
    form.reset({ ...form.getValues(), title: "", description: "", dueDate: "", assigneeIds: [] });
    setTaskModalOpen(false);
  }

  const tasks = tasksQuery.data?.tasks ?? [];
  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;
  const members = membersQuery.data?.members ?? [];
  const filteredTasks = tasks.filter((task) => {
    const assigneeOk = !assigneeFilter || task.assignments.some(({ user }) => user.id === assigneeFilter);
    const priorityOk = !priorityFilter || task.priority === priorityFilter;
    return assigneeOk && priorityOk;
  });
  const openNewTask = () => {
    setSubtaskParent(null);
    setTaskModalOpen(true);
  };
  const openSubtask = (task: TaskSummary) => {
    setSubtaskParent(task.id);
    setTaskModalOpen(true);
  };

  return (
    <main
      className="task-workspace blueprint flex h-full flex-col overflow-hidden bg-background"
      style={{ "--space-color": spaceColor } as CSSProperties}
    >
      <section className="shrink-0 px-3 pt-3 sm:px-5 sm:pt-4">
        <div className="task-hero pixel-card p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-[46px] min-w-[46px] shrink-0 place-items-center rounded-[10px] border-2 px-2 font-tech text-sm font-bold text-white shadow-[0_0_16px_color-mix(in_srgb,var(--space-color)_40%,transparent)]"
              style={{
                background: spaceColor,
                borderColor: `color-mix(in srgb, ${spaceColor} 55%, #fff)`,
                "--space-color": spaceColor,
              } as CSSProperties}
            >
              {spaceKey.slice(0, 3)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[22px] font-semibold">{spaceName}</h1>
                <span
                  className="chip border-transparent px-2 py-0 text-[11px]"
                  style={{
                    color: spaceColor,
                    background: `color-mix(in srgb, ${spaceColor} 12%, transparent)`,
                  }}
                >
                  {spaceKey}
                </span>
              </div>
              <p className="text-[13px] text-muted-foreground">
                จัดการงาน, subtask, วันครบกำหนด และ assignee ในห้องนี้
              </p>
            </div>
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto">
            <div className="seg max-w-full overflow-x-auto">
              <button
                className={viewMode === "board" ? "on" : ""}
                type="button"
                onClick={() => setViewMode("board")}
              >
                <KanbanSquare size={15} />
                บอร์ด
              </button>
              <button
                className={viewMode === "table" ? "on" : ""}
                type="button"
                onClick={() => setViewMode("table")}
              >
                <Table2 size={15} />
                ตาราง
              </button>
              <button
                className={viewMode === "gantt" ? "on" : ""}
                type="button"
                onClick={() => setViewMode("gantt")}
              >
                <GanttChart size={15} />
                Gantt
              </button>
              <button
                className={viewMode === "calendar" ? "on" : ""}
                type="button"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarDays size={15} />
                Calendar
              </button>
            </div>
            <Button className="h-9 px-3 text-[13.5px]" onClick={openNewTask} type="button">
              <Plus size={16} />
              งานใหม่
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Select
            className="h-9 min-w-0 flex-1 sm:w-auto sm:min-w-36 sm:flex-none"
            value={assigneeFilter}
            onChange={(event) => setAssigneeFilter(event.target.value)}
          >
            <option value="">ทุกคน</option>
            {members.map((member) => (
              <option key={member.user.id} value={member.user.id}>
                {member.user.name ?? member.user.email}
              </option>
            ))}
          </Select>
          <Select
            className="h-9 min-w-0 flex-1 sm:w-auto sm:min-w-32 sm:flex-none"
            value={priorityFilter}
            onChange={(event) => setPriorityFilter(event.target.value)}
          >
            <option value="">ทุกระดับ</option>
            {priorityOptions.map((priority) => (
              <option key={priority} value={priority}>
                {taskPriorityLabels[priority].label}
              </option>
            ))}
          </Select>
          {(assigneeFilter || priorityFilter) && (
            <button className="pbtn px-3 py-2 text-sm" onClick={() => { setAssigneeFilter(""); setPriorityFilter(""); }} type="button">
              <X size={14} />
              ล้างตัวกรอง
            </button>
          )}
          <span className="ml-auto text-[13px] text-muted-foreground">{filteredTasks.length} งาน</span>
        </div>
        </div>
      </section>

      <div className="min-h-0 flex-1 p-3 pt-3 sm:p-5 sm:pt-4">
        <section className="h-full min-w-0 overflow-hidden">
          {tasksQuery.isLoading ? (
            <TaskSkeleton />
          ) : viewMode === "board" ? (
            <TaskBoard
              tasks={filteredTasks}
              onStatusChange={(task, status) => updateTask.mutate({ id: task.id, status })}
              onSubtask={openSubtask}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
            />
          ) : viewMode === "table" ? (
            <TaskTable
              tasks={filteredTasks}
              onDone={(task) => updateTask.mutate({ id: task.id, status: task.status === "DONE" ? "TODO" : "DONE" })}
              onSubtask={openSubtask}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
            />
          ) : viewMode === "gantt" ? (
            <TaskGantt tasks={filteredTasks} />
          ) : (
            <TaskCalendar tasks={filteredTasks} />
          )}
        </section>
      </div>
      {taskModalOpen && (
        <TaskFormModal
          busy={createTask.isPending || createSubtask.isPending}
          form={form}
          members={members}
          onClose={() => {
            setTaskModalOpen(false);
            setSubtaskParent(null);
          }}
          onSubmit={submitTask}
          subtaskParent={subtaskParent}
        />
      )}
      {selectedTask && (
        <TaskDetailDrawer
          key={selectedTask.id}
          busy={updateTask.isPending || deleteTask.isPending}
          members={members}
          onClose={() => setSelectedTaskId(null)}
          onDelete={(task) => {
            deleteTask.mutate(task.id, {
              onSuccess: () => setSelectedTaskId(null),
            });
          }}
          onSave={(input) => updateTask.mutate(input)}
          onSubtask={(task) => {
            setSelectedTaskId(null);
            openSubtask(task);
          }}
          task={selectedTask}
        />
      )}
    </main>
  );
}

function TaskBoard({
  tasks,
  onStatusChange,
  onSubtask,
  onOpenTask,
}: {
  tasks: TaskSummary[];
  onStatusChange: (task: TaskSummary, status: TaskSummary["status"]) => void;
  onSubtask: (task: TaskSummary) => void;
  onOpenTask: (task: TaskSummary) => void;
}) {
  const taskById = useMemo(() => new Map(tasks.map((task) => [task.id, task])), [tasks]);

  return (
    <div className="board-strip flex h-full gap-3 overflow-x-auto pb-2">
      {taskStatusOrder.map((status) => {
        const columnTasks = tasks.filter((task) =>
          status === "TODO" ? task.status === "TODO" || task.status === "BACKLOG" : task.status === status,
        );
        return (
          <KanbanColumn
            key={status}
            status={status}
            tasks={columnTasks}
            onDrop={(id) => {
              const task = taskById.get(id);
              if (task) onStatusChange(task, status);
            }}
            onSubtask={onSubtask}
            onOpenTask={onOpenTask}
          />
        );
      })}
    </div>
  );
}

function KanbanColumn({
  status,
  tasks,
  onDrop,
  onSubtask,
  onOpenTask,
}: {
  status: TaskSummary["status"];
  tasks: TaskSummary[];
  onDrop: (id: string) => void;
  onSubtask: (task: TaskSummary) => void;
  onOpenTask: (task: TaskSummary) => void;
}) {
  const [over, setOver] = useState(false);
  const meta = taskStatusLabels[status];

  return (
    <div className="board-column flex w-[290px] shrink-0 flex-col">
      <div className="flex items-center justify-between px-1 pb-2.5">
        <div className="flex items-center gap-2">
          <StatusDot status={status} size={11} />
          <span className="font-tech text-sm font-bold">{meta.label}</span>
          <span className="chip bg-[var(--surface-3)] px-2 py-0 text-[11.5px] text-muted-foreground">
            {tasks.length}
          </span>
        </div>
      </div>
      <div
        className={`kcol-body flex min-h-28 flex-1 flex-col gap-3 rounded-lg p-2 ${over ? "drop-active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(event) => {
          setOver(false);
          const id = event.dataTransfer.getData("text/taskid");
          if (id) onDrop(id);
        }}
      >
        {tasks.map((task) => (
          <TaskTile key={task.id} task={task} onOpenTask={onOpenTask} onSubtask={onSubtask} />
        ))}
        {tasks.length === 0 && (
          <div className="empty-drop flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-5 text-center font-tech text-xs text-[var(--faint)]">
            <Filter size={20} />
            ลากงานมาที่นี่
          </div>
        )}
      </div>
    </div>
  );
}

function TaskTile({
  task,
  onOpenTask,
  onSubtask,
}: {
  task: TaskSummary;
  onOpenTask: (task: TaskSummary) => void;
  onSubtask: (task: TaskSummary) => void;
}) {
  function stopCardClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
  }

  return (
    <article
      draggable
      onClick={() => onOpenTask(task)}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/taskid", task.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      className="pixel-card cursor-pointer border-l-4 p-3 shadow-[0_3px_0_var(--shadow-hard)] transition hover:-translate-y-0.5 hover:shadow-[0_6px_0_var(--shadow-hard)]"
      style={{ borderLeftColor: "var(--dev)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-[14.5px] font-medium leading-snug">{task.title}</h3>
        <PriorityFlag priority={task.priority} />
      </div>
      {task.description && (
        <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted-foreground">{task.description}</p>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <DueChip dueDate={task.dueDate} />
          {task.subtasks.length > 0 && (
            <span className="chip bg-[var(--surface-2)] px-2 py-0 text-[11.5px] text-muted-foreground">
              <Check size={12} />
              {task.subtasks.filter((subtask) => subtask.status === "DONE").length}/{task.subtasks.length}
            </span>
          )}
        </div>
        {task.assignments.length > 0 && <AvatarStack users={task.assignments.map(({ user }) => user)} size={24} max={3} />}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <GripVertical size={13} />
          drag
        </span>
        <button
          className="pbtn px-2 py-1 text-xs"
          type="button"
          onClick={(event) => {
            stopCardClick(event);
            onSubtask(task);
          }}
        >
          <Plus size={12} />
          Subtask
        </button>
      </div>
    </article>
  );
}

function TaskTable({
  tasks,
  onDone,
  onSubtask,
  onOpenTask,
}: {
  tasks: TaskSummary[];
  onDone: (task: TaskSummary) => void;
  onSubtask: (task: TaskSummary) => void;
  onOpenTask: (task: TaskSummary) => void;
}) {
  const columnHelper = createColumnHelper<TaskSummary>();
  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "done",
        header: "",
        cell: ({ row }) => (
          <button type="button" onClick={(event) => { event.stopPropagation(); onDone(row.original); }}>
            <CheckSquare done={row.original.status === "DONE"} />
          </button>
        ),
      }),
      columnHelper.accessor("title", {
        header: "งาน",
        cell: (info) => (
          <span className={info.row.original.status === "DONE" ? "font-medium text-muted-foreground line-through" : "font-medium"}>
            {info.getValue()}
            {info.row.original.subtasks.length > 0 && (
              <span className="ml-2 text-xs text-[var(--faint)]">
                ({info.row.original.subtasks.filter((item) => item.status === "DONE").length}/{info.row.original.subtasks.length})
              </span>
            )}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "สถานะ",
        cell: (info) => <StatusChip status={info.getValue()} />,
      }),
      columnHelper.accessor("priority", {
        header: "ความสำคัญ",
        cell: (info) => <PriorityFlag priority={info.getValue()} withLabel />,
      }),
      columnHelper.display({
        id: "assignees",
        header: "ผู้รับผิดชอบ",
        cell: ({ row }) =>
          row.original.assignments.length ? (
            <AvatarStack users={row.original.assignments.map(({ user }) => user)} size={24} max={3} />
          ) : (
            <span className="text-[var(--faint)]">—</span>
          ),
      }),
      columnHelper.accessor("dueDate", {
        header: "กำหนดส่ง",
        cell: (info) => (
          <span className="font-tech text-[13px] text-muted-foreground">
            {formatDueDate(info.getValue())}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <button
            className="pbtn px-2 py-1 text-xs"
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSubtask(row.original);
            }}
          >
            Subtask
          </button>
        ),
      }),
    ],
    [columnHelper, onDone, onSubtask],
  );
  const table = useReactTable({ data: tasks, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="pixel-card h-full overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b-2 border-[var(--border)] px-3 py-3 text-sm text-muted-foreground">
        <Table2 size={15} />
        ตารางงาน
      </div>
      <div className="h-[calc(100%-48px)] overflow-auto">
        <table className="ftable min-w-[860px]">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 && (
              <tr>
                <td colSpan={7}>
                  <div className="py-10 text-center text-sm text-muted-foreground">ยังไม่มีงานในตัวกรองนี้</div>
                </td>
              </tr>
            )}
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} onClick={() => onOpenTask(row.original)}>
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaskFormModal({
  busy,
  form,
  members,
  onClose,
  onSubmit,
  subtaskParent,
}: {
  busy: boolean;
  form: UseFormReturn<z.input<typeof taskSchema>, unknown, TaskInput>;
  members: { user: { id: string; name: string | null; email: string | null } }[];
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
  subtaskParent: string | null;
}) {
  return (
    <div className="scrim z-[80] flex items-center justify-center p-5" onMouseDown={onClose}>
      <section
        className="pixel-card anim-pop max-h-[92vh] w-full max-w-[560px] overflow-auto bg-[var(--surface)] p-0"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b-2 border-[var(--border)] px-5 py-4">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold text-primary">
              <Plus size={17} />
              {subtaskParent ? "สร้าง Subtask" : "สร้างงานใหม่"}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              กรอกข้อมูลงาน แล้วบันทึกลงบอร์ดทันที
            </p>
          </div>
          <button className="iconbtn h-9 w-9" onClick={onClose} type="button">
            <X size={18} />
          </button>
        </header>

        <form className="grid gap-4 p-5" onSubmit={form.handleSubmit(onSubmit)}>
          <input type="hidden" {...form.register("spaceId")} />
          <div className="grid gap-2">
            <Label className="lbl" htmlFor="title">ชื่องาน</Label>
            <Input id="title" placeholder="เช่น ตรวจ flow invite" {...form.register("title")} autoFocus />
            <FieldError message={form.formState.errors.title?.message} />
          </div>
          <div className="grid gap-2">
            <Label className="lbl" htmlFor="description">รายละเอียด</Label>
            <Textarea id="description" rows={4} {...form.register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label className="lbl">สถานะ</Label>
              <Select {...form.register("status")}>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{taskStatusLabels[status].label}</option>
                ))}
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="lbl">ความสำคัญ</Label>
              <Select {...form.register("priority")}>
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>{taskPriorityLabels[priority].label}</option>
                ))}
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="lbl" htmlFor="dueDate">วันครบกำหนด <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></Label>
            <Input id="dueDate" type="datetime-local" {...form.register("dueDate")} />
          </div>
          <div className="grid gap-2">
            <Label className="lbl">ผู้รับผิดชอบ</Label>
            <div className="pixel-frame grid max-h-44 gap-2 overflow-auto p-2">
              {members.map((member) => (
                <label key={member.user.id} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={member.user.id}
                    {...form.register("assigneeIds")}
                  />
                  <span className="grid h-7 w-7 place-items-center rounded bg-[var(--surface-3)] text-[10px] font-semibold">
                    {member.user.name?.slice(0, 1) ?? "M"}
                  </span>
                  <span className="truncate">{member.user.name ?? member.user.email}</span>
                </label>
              ))}
            </div>
          </div>
          <footer className="flex justify-end gap-2 border-t-2 border-[var(--border)] pt-4">
            <button className="pbtn px-3 py-2 text-sm" type="button" onClick={onClose}>
              ยกเลิก
            </button>
            <Button disabled={busy} type="submit">
              <Plus size={15} />
              {busy ? "กำลังสร้าง..." : subtaskParent ? "สร้าง subtask" : "สร้างงาน"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function TaskDetailDrawer({
  busy,
  members,
  onClose,
  onDelete,
  onSave,
  onSubtask,
  task,
}: {
  busy: boolean;
  members: { user: { id: string; name: string | null; email: string | null } }[];
  onClose: () => void;
  onDelete: (task: TaskSummary) => void;
  onSave: (input: TaskUpdateInput) => void;
  onSubtask: (task: TaskSummary) => void;
  task: TaskSummary;
}) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");
  const [status, setStatus] = useState<TaskSummary["status"]>(task.status);
  const [priority, setPriority] = useState<TaskSummary["priority"]>(task.priority);
  const [dueDate, setDueDate] = useState(toDatetimeLocal(task.dueDate));
  const [assigneeIds, setAssigneeIds] = useState(() => task.assignments.map(({ user }) => user.id));

  function toggleAssignee(userId: string) {
    setAssigneeIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  }

  function save() {
    onSave({
      id: task.id,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : "",
      assigneeIds,
    });
  }

  function remove() {
    const confirmed = window.confirm(`ลบงาน "${task.title}" และ subtasks ทั้งหมดใช่ไหม?`);
    if (!confirmed) return;
    onDelete(task);
  }

  return (
    <div className="fixed inset-0 z-[85] flex justify-end bg-black/35" onMouseDown={onClose}>
      <aside
        className="anim-rise flex h-full w-full max-w-[440px] flex-col border-l-2 border-[var(--border-2)] bg-[var(--surface)] shadow-[-12px_0_32px_rgba(0,0,0,.25)]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-3 border-b-2 border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            <p className="font-tech text-xs font-bold uppercase tracking-[.4px] text-muted-foreground">Task details</p>
            <h2 className="mt-1 truncate text-xl font-semibold">{task.title}</h2>
          </div>
          <button className="iconbtn h-9 w-9" type="button" onClick={onClose} aria-label="ปิดรายละเอียดงาน">
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="lbl" htmlFor="drawer-title">ชื่องาน</Label>
              <Input id="drawer-title" value={title} onChange={(event) => setTitle(event.target.value)} />
            </div>

            <div className="grid gap-2">
              <Label className="lbl" htmlFor="drawer-description">รายละเอียด</Label>
              <Textarea
                id="drawer-description"
                rows={5}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="lbl" htmlFor="drawer-status">สถานะ</Label>
                <Select
                  id="drawer-status"
                  value={status}
                  onChange={(event) => setStatus(event.target.value as TaskSummary["status"])}
                >
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>{taskStatusLabels[item].label}</option>
                  ))}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="lbl" htmlFor="drawer-priority">ความสำคัญ</Label>
                <Select
                  id="drawer-priority"
                  value={priority}
                  onChange={(event) => setPriority(event.target.value as TaskSummary["priority"])}
                >
                  {priorityOptions.map((item) => (
                    <option key={item} value={item}>{taskPriorityLabels[item].label}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="lbl" htmlFor="drawer-due">วันครบกำหนด <span className="font-normal text-muted-foreground">(ไม่บังคับ)</span></Label>
              <Input
                id="drawer-due"
                type="datetime-local"
                value={dueDate}
                onChange={(event) => setDueDate(event.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label className="lbl">ผู้รับผิดชอบ</Label>
              <div className="pixel-frame grid max-h-52 gap-2 overflow-auto p-2">
                {members.length === 0 && (
                  <p className="text-sm text-muted-foreground">ยังไม่มีสมาชิกใน workspace</p>
                )}
                {members.map((member) => (
                  <label key={member.user.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-[var(--hover)]">
                    <input
                      type="checkbox"
                      checked={assigneeIds.includes(member.user.id)}
                      onChange={() => toggleAssignee(member.user.id)}
                    />
                    <span className="grid h-7 w-7 place-items-center rounded bg-[var(--surface-3)] text-[10px] font-semibold">
                      {member.user.name?.slice(0, 1) ?? member.user.email?.slice(0, 1) ?? "M"}
                    </span>
                    <span className="min-w-0 truncate">{member.user.name ?? member.user.email}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pixel-frame grid gap-2 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold">Subtasks</span>
                <button className="pbtn px-2 py-1 text-xs" type="button" onClick={() => onSubtask(task)}>
                  <Plus size={12} />
                  เพิ่ม
                </button>
              </div>
              {task.subtasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">ยังไม่มี subtask</p>
              ) : (
                task.subtasks.map((subtask) => (
                  <div key={subtask.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className={subtask.status === "DONE" ? "text-muted-foreground line-through" : ""}>
                      {subtask.title}
                    </span>
                    <StatusChip status={subtask.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t-2 border-[var(--border)] p-4">
          <Button disabled={busy} variant="destructive" type="button" onClick={remove}>
            <Trash2 size={15} />
            ลบงาน
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <button className="pbtn px-3 py-2 text-sm" type="button" onClick={onClose}>
              ปิด
            </button>
            <Button disabled={busy || title.trim().length < 2} type="button" onClick={save}>
              <Save size={15} />
              {busy ? "กำลังบันทึก..." : "บันทึก"}
            </Button>
          </div>
        </footer>
      </aside>
    </div>
  );
}

function TaskGantt({ tasks }: { tasks: TaskSummary[] }) {
  const datedTasks = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());
  const days = buildDays(datedTasks);

  return (
    <div className="pixel-card h-full overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b-2 border-[var(--border)] px-3 py-3 text-sm text-muted-foreground">
        <GanttChart size={15} />
        Gantt view
      </div>
      <div className="h-[calc(100%-48px)] overflow-auto p-3">
        {datedTasks.length === 0 ? (
          <EmptyTimeline text="ยังไม่มีงานที่ตั้งวันครบกำหนด" />
        ) : (
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[220px_repeat(14,minmax(54px,1fr))] border-b-2 border-[var(--border)] pb-2 text-xs text-muted-foreground">
              <span className="font-tech font-semibold">งาน</span>
              {days.map((day) => (
                <span key={day.toISOString()} className="text-center font-tech">
                  {day.getDate()}/{day.getMonth() + 1}
                </span>
              ))}
            </div>
            <div className="grid gap-2 pt-3">
              {datedTasks.map((task) => {
                const due = new Date(task.dueDate ?? "");
                const index = Math.max(0, Math.min(days.length - 1, dayDiff(days[0], due)));
                return (
                  <div
                    key={task.id}
                    className="grid grid-cols-[220px_repeat(14,minmax(54px,1fr))] items-center gap-0"
                  >
                    <div className="truncate pr-3 text-sm font-medium">{task.title}</div>
                    {days.map((day, dayIndex) => (
                      <div key={day.toISOString()} className="h-9 border-l border-[var(--border)]/60 px-1">
                        {dayIndex === index && (
                          <div className="chip h-7 justify-center truncate border-transparent bg-primary text-primary-foreground">
                            <PriorityFlag priority={task.priority} />
                            <span className="truncate">{formatDueDate(task.dueDate)}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskCalendar({ tasks }: { tasks: TaskSummary[] }) {
  const days = buildMonthDays(new Date());
  const tasksByDate = new Map<string, TaskSummary[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = dateKey(new Date(task.dueDate));
    tasksByDate.set(key, [...(tasksByDate.get(key) ?? []), task]);
  }

  return (
    <div className="pixel-card h-full overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b-2 border-[var(--border)] px-3 py-3 text-sm text-muted-foreground">
        <CalendarDays size={15} />
        Calendar view
      </div>
      <div className="h-[calc(100%-48px)] overflow-auto p-3">
        <div className="grid min-w-[860px] grid-cols-7 gap-2">
          {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((label) => (
            <div key={label} className="font-tech px-2 text-xs font-semibold text-muted-foreground">
              {label}
            </div>
          ))}
          {days.map((day) => {
            const dayTasks = tasksByDate.get(dateKey(day)) ?? [];
            const muted = day.getMonth() !== new Date().getMonth();
            return (
              <div key={day.toISOString()} className="pixel-frame min-h-28 p-2">
                <div className={`font-tech text-xs font-semibold ${muted ? "text-[var(--faint)]" : ""}`}>
                  {day.getDate()}
                </div>
                <div className="mt-2 grid gap-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="truncate rounded border border-[var(--border)] bg-[var(--surface-2)] px-2 py-1 text-xs">
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <span className="text-xs text-muted-foreground">+{dayTasks.length - 3} งาน</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function EmptyTimeline({ text }: { text: string }) {
  return (
    <div className="flex h-full min-h-64 items-center justify-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function buildDays(tasks: TaskSummary[]) {
  const today = startOfDay(new Date());
  const first = tasks[0]?.dueDate ? startOfDay(new Date(tasks[0].dueDate)) : today;
  const start = first < today ? first : today;
  return Array.from({ length: 14 }, (_, index) => addDays(start, index));
}

function buildMonthDays(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDiff(start: Date, end: Date) {
  return Math.round((startOfDay(end).getTime() - startOfDay(start).getTime()) / 86400000);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function TaskSkeleton() {
  return (
    <div className="flex h-full gap-3 overflow-hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="h-full w-[290px] shrink-0 animate-pulse rounded-lg border bg-muted" />
      ))}
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetcher";
import type { TaskInput, TaskUpdateInput } from "@/lib/schemas";

export type TaskSummary = {
  id: string;
  title: string;
  description: string | null;
  status: "BACKLOG" | "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  parentTaskId: string | null;
  createdAt: string;
  updatedAt: string;
  creator: { id: string; name: string | null; image: string | null };
  assignments: { user: { id: string; name: string | null; image: string | null } }[];
  subtasks: { id: string; title: string; status: TaskSummary["status"] }[];
};

export function useTasks(spaceId?: string) {
  return useQuery({
    enabled: Boolean(spaceId),
    queryKey: ["tasks", spaceId],
    queryFn: () => apiFetch<{ tasks: TaskSummary[] }>(`/api/tasks?spaceId=${spaceId}`),
    placeholderData: keepPreviousData,
    refetchOnWindowFocus: false,
    staleTime: 20_000,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskInput) =>
      apiFetch<{ task: TaskSummary }>("/api/tasks", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["tasks", variables.spaceId] }),
  });
}

export function useUpdateTask(spaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: TaskUpdateInput) =>
      apiFetch<{ task: TaskSummary }>(`/api/tasks/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onMutate: async (input) => {
      if (!spaceId) return undefined;
      const queryKey = ["tasks", spaceId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ tasks: TaskSummary[] }>(queryKey);
      queryClient.setQueryData<{ tasks: TaskSummary[] }>(queryKey, (current) => {
        if (!current) return current;
        const userById = new Map<string, TaskSummary["assignments"][number]["user"]>();
        current.tasks.forEach((task) => {
          task.assignments.forEach(({ user }) => userById.set(user.id, user));
        });
        return {
          tasks: current.tasks.map((task) =>
            task.id === input.id
              ? {
                  ...task,
                  title: input.title ?? task.title,
                  description: input.description ?? task.description,
                  status: input.status ?? task.status,
                  priority: input.priority ?? task.priority,
                  dueDate: input.dueDate === undefined ? task.dueDate : input.dueDate || null,
                  assignments:
                    input.assigneeIds === undefined
                      ? task.assignments
                      : input.assigneeIds.map((userId) => ({
                          user: userById.get(userId) ?? { id: userId, name: null, image: null },
                        })),
                  updatedAt: new Date().toISOString(),
                }
              : task,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _input, context) => {
      if (spaceId && context?.previous) {
        queryClient.setQueryData(["tasks", spaceId], context.previous);
      }
    },
    onSuccess: (data, input) => {
      if (spaceId) {
        queryClient.setQueryData<{ tasks: TaskSummary[] }>(["tasks", spaceId], (current) => {
          if (!current) return current;
          return {
            tasks: current.tasks.map((task) =>
              task.id === data.task.id
                ? {
                    ...data.task,
                    assignments:
                      input.assigneeIds === undefined ? task.assignments : data.task.assignments,
                  }
                : task,
            ),
          };
        });
      }
    },
    onSettled: () => {
      if (spaceId) queryClient.invalidateQueries({ queryKey: ["tasks", spaceId] });
    },
  });
}

export function useDeleteTask(spaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<{ ok: true }>(`/api/tasks/${taskId}`, { method: "DELETE" }),
    onMutate: async (taskId) => {
      if (!spaceId) return undefined;
      const queryKey = ["tasks", spaceId] as const;
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<{ tasks: TaskSummary[] }>(queryKey);
      queryClient.setQueryData<{ tasks: TaskSummary[] }>(queryKey, (current) => {
        if (!current) return current;
        return {
          tasks: current.tasks.filter(
            (task) => task.id !== taskId && task.parentTaskId !== taskId,
          ),
        };
      });
      return { previous };
    },
    onError: (_error, _taskId, context) => {
      if (spaceId && context?.previous) {
        queryClient.setQueryData(["tasks", spaceId], context.previous);
      }
    },
    onSettled: () => {
      if (spaceId) {
        queryClient.invalidateQueries({ queryKey: ["tasks", spaceId] });
        queryClient.invalidateQueries({ queryKey: ["spaces"] });
      }
    },
  });
}

export function useCreateSubtask(spaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, ...input }: TaskInput & { taskId: string }) =>
      apiFetch<{ task: TaskSummary }>(`/api/tasks/${taskId}/subtasks`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      if (spaceId) queryClient.invalidateQueries({ queryKey: ["tasks", spaceId] });
    },
  });
}

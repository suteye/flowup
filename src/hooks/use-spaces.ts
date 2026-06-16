"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetcher";
import type { SpaceInput, SpaceUpdateInput } from "@/lib/schemas";

export type SpaceSummary = {
  id: string;
  name: string;
  key: string;
  description: string | null;
  color: string;
  visibility: "PUBLIC" | "SELECTED" | "PRIVATE";
  ownerId: string | null;
  viewerIds: string[];
  taskCount: number;
};

export function useSpaces(workspaceId?: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: ["spaces", workspaceId],
    queryFn: () =>
      apiFetch<{ spaces: SpaceSummary[] }>(`/api/spaces?workspaceId=${workspaceId}`),
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SpaceInput) =>
      apiFetch<{ space: SpaceSummary }>("/api/spaces", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: (_, variables) =>
      queryClient.invalidateQueries({ queryKey: ["spaces", variables.workspaceId] }),
  });
}

export function useUpdateSpace(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: SpaceUpdateInput) =>
      apiFetch<{ space: SpaceSummary }>(`/api/spaces/${input.id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      if (workspaceId) queryClient.invalidateQueries({ queryKey: ["spaces", workspaceId] });
    },
  });
}

export function useDeleteSpace(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (spaceId: string) =>
      apiFetch<{ ok: true }>(`/api/spaces/${spaceId}`, { method: "DELETE" }),
    onSuccess: () => {
      if (workspaceId) queryClient.invalidateQueries({ queryKey: ["spaces", workspaceId] });
    },
  });
}

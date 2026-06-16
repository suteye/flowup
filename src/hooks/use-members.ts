"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetcher";
import type { WorkspaceMemberRemoveInput, WorkspaceMemberRoleInput } from "@/lib/schemas";

export type WorkspaceMemberSummary = {
  id: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    displayName: string | null;
    email: string | null;
    image: string | null;
    avatarTone: "orange" | "gray" | "cream" | "tux" | "blue" | "pink";
    avatarAccent: string;
  };
};

export function useMembers(workspaceId?: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: ["members", workspaceId],
    queryFn: () =>
      apiFetch<{ members: WorkspaceMemberSummary[] }>(
        `/api/workspaces/${workspaceId}/members`,
      ),
  });
}

export function useUpdateMemberRole(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkspaceMemberRoleInput) =>
      apiFetch<{ member: WorkspaceMemberSummary }>(`/api/workspaces/${workspaceId}/members`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["members", workspaceId] }),
  });
}

export function useRemoveMember(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkspaceMemberRemoveInput) =>
      apiFetch<{ ok: true }>(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["members", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["spaces", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

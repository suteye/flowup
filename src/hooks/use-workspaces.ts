"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetcher";
import type { WorkspaceInput } from "@/lib/schemas";

export type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  role: "OWNER" | "ADMIN" | "MEMBER";
};

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: () => apiFetch<{ workspaces: WorkspaceSummary[] }>("/api/workspaces"),
  });
}

export function useCurrentWorkspace(slug?: string) {
  const query = useWorkspaces();
  return {
    ...query,
    workspace: query.data?.workspaces.find((workspace) => workspace.slug === slug),
  };
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: WorkspaceInput) =>
      apiFetch<{ workspace: WorkspaceSummary }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/fetcher";
import type { InviteCreateInput } from "@/lib/schemas";

export type InviteSummary = {
  id: string;
  token: string;
  email: string | null;
  role: "ADMIN" | "MEMBER";
  status: "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
  expiresAt: string;
};

export function useInvites(workspaceId?: string) {
  return useQuery({
    enabled: Boolean(workspaceId),
    queryKey: ["invites", workspaceId],
    queryFn: () =>
      apiFetch<{ invites: InviteSummary[] }>(
        `/api/workspaces/${workspaceId}/invites`,
      ),
  });
}

export function useInviteMember(workspaceId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: InviteCreateInput) =>
      apiFetch<{ invite: InviteSummary }>(`/api/workspaces/${workspaceId}/invites`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["invites", workspaceId] }),
  });
}

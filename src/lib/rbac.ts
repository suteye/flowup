import type { WorkspaceRole } from "@/generated/prisma/enums";

const roleWeight: Record<WorkspaceRole, number> = {
  OWNER: 3,
  ADMIN: 2,
  MEMBER: 1,
};

export function canManageWorkspace(role?: WorkspaceRole | null) {
  return role === "OWNER" || role === "ADMIN";
}

export function canInvite(role?: WorkspaceRole | null) {
  return canManageWorkspace(role);
}

export function roleAtLeast(role: WorkspaceRole, minimum: WorkspaceRole) {
  return roleWeight[role] >= roleWeight[minimum];
}

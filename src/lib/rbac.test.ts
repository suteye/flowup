import { describe, expect, it } from "vitest";
import { canInvite, canManageWorkspace, roleAtLeast } from "@/lib/rbac";

describe("rbac", () => {
  it("allows owners and admins to manage workspace", () => {
    expect(canManageWorkspace("OWNER")).toBe(true);
    expect(canManageWorkspace("ADMIN")).toBe(true);
    expect(canManageWorkspace("MEMBER")).toBe(false);
  });

  it("allows invite management for admins and owners", () => {
    expect(canInvite("OWNER")).toBe(true);
    expect(canInvite("MEMBER")).toBe(false);
  });

  it("compares role hierarchy", () => {
    expect(roleAtLeast("OWNER", "ADMIN")).toBe(true);
    expect(roleAtLeast("MEMBER", "ADMIN")).toBe(false);
  });
});

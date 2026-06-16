import { describe, expect, it } from "vitest";
import { inviteAcceptSchema, taskSchema, workspaceSchema } from "@/lib/schemas";

describe("schemas", () => {
  it("validates workspace creation", () => {
    expect(workspaceSchema.parse({ name: "Cat Ops" }).name).toBe("Cat Ops");
    expect(() => workspaceSchema.parse({ name: "C" })).toThrow();
  });

  it("validates invite tokens", () => {
    expect(inviteAcceptSchema.parse({ token: "123456789012" }).token).toHaveLength(12);
    expect(() => inviteAcceptSchema.parse({ token: "tiny" })).toThrow();
  });

  it("validates task creation defaults", () => {
    const parsed = taskSchema.parse({
      spaceId: "space_1",
      title: "Prepare launch checklist",
    });
    expect(parsed.status).toBe("TODO");
    expect(parsed.priority).toBe("MEDIUM");
  });

  it("allows tasks without a due date", () => {
    expect(
      taskSchema.parse({
        spaceId: "space_1",
        title: "Clarify unclear scope",
        dueDate: "",
      }).dueDate,
    ).toBe("");
  });

  it("accepts browser datetime-local values", () => {
    expect(
      taskSchema.parse({
        spaceId: "space_1",
        title: "Draft handoff note",
        dueDate: "2026-06-16T21:57",
      }).dueDate,
    ).toBe("2026-06-16T21:57");
  });
});

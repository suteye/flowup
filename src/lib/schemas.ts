import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(240).optional().or(z.literal("")),
  icon: z.string().min(1).max(8).default("🐾"),
  color: z.string().min(3).max(32).default("#8B6CF6"),
});

export const profileOnboardingSchema = z.object({
  displayName: z.string().min(2).max(80),
  avatarTone: z
    .enum(["orange", "gray", "cream", "tux", "blue", "pink"])
    .default("orange"),
  avatarAccent: z.string().min(3).max(32).default("#8B6CF6"),
});

export const inviteAcceptSchema = z.object({
  token: z.string().min(12).max(160),
});

export const inviteCreateSchema = z.object({
  email: z.string().email().optional().or(z.literal("")),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export const workspaceMemberRoleSchema = z.object({
  memberId: z.string().min(1),
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

export const workspaceMemberRemoveSchema = z.object({
  memberId: z.string().min(1),
});

export const spaceSchema = z.object({
  workspaceId: z.string().min(1),
  name: z.string().min(2).max(64),
  key: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[A-Z0-9]+$/, "Use 2-8 uppercase letters or numbers."),
  description: z.string().max(180).optional().or(z.literal("")),
  color: z.string().max(80).optional(),
  visibility: z.enum(["PUBLIC", "SELECTED", "PRIVATE"]).default("PUBLIC"),
  viewerIds: z.array(z.string()).default([]),
});

export const spaceUpdateSchema = spaceSchema.partial().extend({
  id: z.string().min(1),
});

const optionalDateTimeSchema = z
  .union([
    z.string().datetime({ local: true }),
    z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/),
  ])
  .optional()
  .or(z.literal(""));

export const taskSchema = z.object({
  spaceId: z.string().min(1),
  title: z.string().min(2).max(140),
  description: z.string().max(2000).optional().or(z.literal("")),
  status: z
    .enum(["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "DONE"])
    .default("TODO"),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  dueDate: optionalDateTimeSchema,
  assigneeIds: z.array(z.string()).default([]),
  parentTaskId: z.string().optional(),
});

export const taskUpdateSchema = taskSchema.partial().extend({
  id: z.string().min(1),
});

export const notificationIntegrationSchema = z.object({
  workspaceId: z.string().min(1),
  provider: z.enum(["TELEGRAM", "LINE"]),
  label: z.string().min(2).max(80),
  enabled: z.boolean().default(false),
  config: z.object({
    chatId: z.string().optional(),
    lineUserId: z.string().optional(),
    channelId: z.string().optional(),
  }),
  token: z.string().optional().or(z.literal("")),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;
export type ProfileOnboardingInput = z.infer<typeof profileOnboardingSchema>;
export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;
export type WorkspaceMemberRoleInput = z.infer<typeof workspaceMemberRoleSchema>;
export type WorkspaceMemberRemoveInput = z.infer<typeof workspaceMemberRemoveSchema>;
export type SpaceInput = z.infer<typeof spaceSchema>;
export type SpaceUpdateInput = z.infer<typeof spaceUpdateSchema>;
export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type NotificationIntegrationInput = z.infer<
  typeof notificationIntegrationSchema
>;

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Copy, Inbox, Link2, Send, Trash2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CatAvatar } from "@/components/pixel-primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { inviteCreateSchema, type InviteCreateInput } from "@/lib/schemas";
import { useInviteMember, useInvites } from "@/hooks/use-invites";
import { useMembers, useRemoveMember, useUpdateMemberRole } from "@/hooks/use-members";

export function InvitesPanel({
  workspaceId,
  workspaceSlug,
  currentUserId,
  currentRole,
}: {
  workspaceId: string;
  workspaceSlug: string;
  currentUserId: string;
  currentRole: "OWNER" | "ADMIN" | "MEMBER";
}) {
  const invites = useInvites(workspaceId);
  const members = useMembers(workspaceId);
  const updateMemberRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);
  const inviteMember = useInviteMember(workspaceId);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [lastCreatedToken, setLastCreatedToken] = useState<string | null>(null);
  const form = useForm<
    z.input<typeof inviteCreateSchema>,
    unknown,
    InviteCreateInput
  >({
    resolver: zodResolver(inviteCreateSchema),
    defaultValues: { email: "", role: "MEMBER" },
  });

  async function submit(input: InviteCreateInput) {
    const result = await inviteMember.mutateAsync(input);
    setLastCreatedToken(result.invite.token);
    form.reset({ email: "", role: "MEMBER" });
  }

  function inviteUrl(token: string) {
    if (typeof window === "undefined") return token;
    return `${window.location.origin}/onboarding?invite=${token}`;
  }

  const visibleInvites = useMemo(() => invites.data?.invites ?? [], [invites.data?.invites]);
  const pendingInvites = visibleInvites.filter((invite) => invite.status === "PENDING");
  const visibleMembers = useMemo(() => members.data?.members ?? [], [members.data?.members]);
  const ownerCount = visibleMembers.filter((member) => member.role === "OWNER").length;

  async function copyInvite(token: string) {
    await navigator.clipboard.writeText(inviteUrl(token));
    setCopiedToken(token);
    window.setTimeout(() => setCopiedToken(null), 1400);
  }

  function deleteMember(member: (typeof visibleMembers)[number]) {
    const name = member.user.displayName ?? member.user.name ?? member.user.email ?? "สมาชิกนี้";
    const confirmed = window.confirm(`ลบ ${name} ออกจาก workspace นี้ใช่ไหม? งานที่ assign ให้คนนี้จะถูกถอนออกด้วย`);
    if (!confirmed) return;
    removeMember.mutate({ memberId: member.id });
  }

  return (
    <main className="blueprint h-full overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto grid max-w-[1180px] gap-5">
        <section className="pixel-card p-5">
          <div className="mb-5 flex items-center gap-3">
            <Users size={20} className="text-primary" />
            <div>
              <h1 className="text-xl font-semibold">เชิญสมาชิกเข้า Workspace</h1>
              <p className="text-sm text-muted-foreground">ส่งคำเชิญให้เข้าร่วม `{workspaceSlug}` ด้วยบทบาทที่กำหนด</p>
            </div>
          </div>
          <form className="grid gap-3 lg:grid-cols-[1fr_170px_170px]" onSubmit={form.handleSubmit(submit)}>
            <div className="grid gap-2">
              <Label className="lbl">อีเมล</Label>
              <Input type="email" placeholder="name@company.com" {...form.register("email")} />
            </div>
            <div className="grid gap-2">
              <Label className="lbl">บทบาท</Label>
              <Select {...form.register("role")}>
                <option value="MEMBER">สมาชิก</option>
                <option value="ADMIN">ผู้ดูแล</option>
              </Select>
            </div>
            <div className="flex items-end">
              <Button className="h-10 w-full" disabled={inviteMember.isPending} type="submit">
                <Send size={16} />
                {inviteMember.isPending ? "กำลังส่ง..." : "ส่งคำเชิญ"}
              </Button>
            </div>
          </form>
          {lastCreatedToken && (
            <div className="mt-4 flex flex-wrap items-center gap-2 rounded-md border-2 border-[var(--st-done)] bg-[color-mix(in_srgb,var(--st-done)_10%,var(--surface))] p-3 text-sm">
              <Check size={15} className="text-[var(--st-done)]" />
              <span className="font-semibold">สร้างลิงก์เชิญแล้ว</span>
              <button className="pbtn ml-auto px-3 py-1.5 text-xs" type="button" onClick={() => copyInvite(lastCreatedToken)}>
                {copiedToken === lastCreatedToken ? <Check size={14} /> : <Copy size={14} />}
                คัดลอกลิงก์
              </button>
            </div>
          )}
        </section>

        <section className="pixel-card overflow-hidden p-0">
          <PanelHeader
            icon={<Inbox size={18} />}
            title="คำเชิญที่รอตอบรับ"
            count={pendingInvites.length}
          />
          <div className="grid gap-1 p-4">
            {invites.isLoading && <p className="p-4 text-sm text-muted-foreground">กำลังโหลดคำเชิญ...</p>}
            {!invites.isLoading && pendingInvites.length === 0 && (
              <p className="rounded-md border-2 border-dashed border-[var(--border)] p-4 text-sm text-muted-foreground">
                ยังไม่มีคำเชิญที่รอตอบรับ
              </p>
            )}
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex flex-wrap items-center gap-3 rounded-md px-3 py-3 hover:bg-[var(--hover)]">
                <span className="grid h-9 w-9 place-items-center rounded-md bg-[var(--surface-3)] text-muted-foreground">
                  <Inbox size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{invite.email || "ลิงก์เชิญแบบไม่ระบุอีเมล"}</p>
                  <p className="text-sm text-muted-foreground">
                    โค้ด {invite.token.slice(0, 12).toUpperCase()} · หมดอายุ {new Date(invite.expiresAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <Badge variant="muted">{roleLabel(invite.role)}</Badge>
                <button className="pbtn px-3 py-2 text-sm" type="button" onClick={() => copyInvite(invite.token)}>
                  {copiedToken === invite.token ? <Check size={15} /> : <Link2 size={15} />}
                  คัดลอกลิงก์
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="pixel-card overflow-hidden p-0">
          <PanelHeader
            icon={<Users size={18} />}
            title="สมาชิกทั้งหมด"
            count={visibleMembers.length}
          />
          <div className="grid gap-1 p-4">
            {members.isLoading && <p className="p-4 text-sm text-muted-foreground">กำลังโหลดสมาชิก...</p>}
            {visibleMembers.map((member) => {
              const isCurrentUser = member.user.id === currentUserId;
              const isLastOwner = member.role === "OWNER" && ownerCount <= 1;
              const canRemove = currentRole === "OWNER" && !isCurrentUser && !isLastOwner;

              return (
                <div key={member.id} className="flex flex-wrap items-center gap-3 rounded-md px-3 py-3 hover:bg-[var(--hover)]">
                  <CatAvatar
                    cat={member.user.avatarTone}
                    size={42}
                    online
                    className="rounded-md"
                    title={member.user.displayName ?? member.user.name ?? member.user.email}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{member.user.displayName ?? member.user.name ?? "FlowUp member"}</p>
                    <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
                  </div>
                  <span className="flex items-center gap-2 text-sm font-semibold text-[var(--st-done)]">
                    <span className="h-2.5 w-2.5 rounded-[2px] bg-[var(--st-done)]" />
                    ออนไลน์
                  </span>
                  <MemberRoleControl
                    disabled={
                      currentRole !== "OWNER" ||
                      updateMemberRole.isPending ||
                      (member.role === "OWNER" && ownerCount <= 1 && isCurrentUser)
                    }
                    role={member.role}
                    onChange={(role) => updateMemberRole.mutate({ memberId: member.id, role })}
                  />
                  <Button
                    aria-label={`ลบ ${member.user.displayName ?? member.user.name ?? member.user.email ?? "สมาชิก"}`}
                    disabled={!canRemove || removeMember.isPending}
                    size="icon"
                    title={canRemove ? "ลบออกจาก workspace" : "ลบสมาชิกนี้ไม่ได้"}
                    type="button"
                    variant="ghost"
                    className="border-[var(--pr-urgent)] text-[var(--pr-urgent)] hover:bg-[color-mix(in_srgb,var(--pr-urgent)_10%,var(--surface))]"
                    onClick={() => deleteMember(member)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelHeader({
  icon,
  title,
  count,
}: {
  icon: ReactNode;
  title: string;
  count: number;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b-2 border-[var(--border)] px-5 py-4">
      <h2 className="flex items-center gap-2 text-lg font-semibold">
        {icon}
        {title}
      </h2>
      <span className="chip bg-[var(--surface-3)] px-3 py-1 text-sm">{count}</span>
    </header>
  );
}

function roleLabel(role: "OWNER" | "ADMIN" | "MEMBER") {
  return role === "OWNER" ? "เจ้าของ" : role === "ADMIN" ? "ผู้ดูแล" : "สมาชิก";
}

function MemberRoleControl({
  role,
  disabled,
  onChange,
}: {
  role: "OWNER" | "ADMIN" | "MEMBER";
  disabled: boolean;
  onChange: (role: "OWNER" | "ADMIN" | "MEMBER") => void;
}) {
  if (disabled) {
    return (
      <Badge variant={role === "OWNER" ? "default" : "muted"}>
        {roleLabel(role)}
      </Badge>
    );
  }

  return (
    <Select
      className="h-9 w-32"
      value={role}
      onChange={(event) => onChange(event.target.value as "OWNER" | "ADMIN" | "MEMBER")}
      aria-label="เปลี่ยนบทบาทสมาชิก"
    >
      <option value="OWNER">เจ้าของ</option>
      <option value="ADMIN">ผู้ดูแล</option>
      <option value="MEMBER">สมาชิก</option>
    </Select>
  );
}

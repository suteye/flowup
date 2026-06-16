"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { ArrowRight, Link2, Plus, Sparkles, UserRound } from "lucide-react";
import { CatAvatar } from "@/components/pixel-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/fetcher";
import {
  inviteAcceptSchema,
  profileOnboardingSchema,
  workspaceSchema,
  type ProfileOnboardingInput,
  type WorkspaceInput,
} from "@/lib/schemas";
import { useCreateWorkspace } from "@/hooks/use-workspaces";

export function OnboardingClient({
  initialDisplayName,
  initialInviteToken,
}: {
  initialDisplayName: string;
  initialInviteToken: string;
}) {
  const router = useRouter();
  const createWorkspace = useCreateWorkspace();
  const [step, setStep] = useState<"profile" | "workspace">("profile");
  const [tab, setTab] = useState<"create" | "join">(initialInviteToken ? "join" : "create");
  const [icon, setIcon] = useState("🐾");
  const [accent, setAccent] = useState("#8B6CF6");
  const [workspaceNamePreview, setWorkspaceNamePreview] = useState("");
  const [avatarTone, setAvatarTone] = useState<ProfileOnboardingInput["avatarTone"]>("orange");
  const [avatarAccent, setAvatarAccent] = useState("#8B6CF6");
  const [profilePending, setProfilePending] = useState(false);
  const profileForm = useForm<z.input<typeof profileOnboardingSchema>, unknown, ProfileOnboardingInput>({
    resolver: zodResolver(profileOnboardingSchema),
    defaultValues: {
      displayName: initialDisplayName,
      avatarTone: "orange",
      avatarAccent: "#8B6CF6",
    },
  });
  const workspaceForm = useForm<z.input<typeof workspaceSchema>, unknown, WorkspaceInput>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: { name: "", description: "", icon: "🐾", color: "#8B6CF6" },
  });
  const inviteForm = useForm<{ token: string }>({
    resolver: zodResolver(inviteAcceptSchema),
    defaultValues: { token: initialInviteToken },
  });

  async function onSaveProfile(input: ProfileOnboardingInput) {
    setProfilePending(true);
    try {
      await apiFetch("/api/me/profile", {
        method: "PATCH",
        body: JSON.stringify({
          ...input,
          avatarTone,
          avatarAccent,
        }),
      });
      setStep("workspace");
    } finally {
      setProfilePending(false);
    }
  }

  async function onCreateWorkspace(input: WorkspaceInput) {
    const result = await createWorkspace.mutateAsync({
      ...input,
      icon,
      color: accent,
    });
    router.push(`/${result.workspace.slug}/dashboard`);
  }

  async function onAcceptInvite(input: { token: string }) {
    const result = await apiFetch<{ workspace: { slug: string } }>(
      "/api/invites/accept",
      { method: "POST", body: JSON.stringify(input) },
    );
    router.push(`/${result.workspace.slug}/dashboard`);
  }

  const icons = ["🐾", "🐱", "🧪", "🚀", "⚙️", "📦", "🎯", "🛰️"];
  const accents = ["#8B6CF6", "#00D9C0", "#FF5CA8", "#FFA630", "#3E8BFF", "#2FD17A"];
  const avatarTones: ProfileOnboardingInput["avatarTone"][] = ["orange", "gray", "cream", "tux", "blue", "pink"];

  return (
    <section className="anim-fade w-full max-w-[380px]">
      <div className="mt-6 flex items-center gap-2">
        <span className={`h-2 flex-1 rounded-full ${step === "profile" ? "bg-primary" : "bg-primary/40"}`} />
        <span className={`h-2 flex-1 rounded-full ${step === "workspace" ? "bg-primary" : "bg-[var(--surface-3)]"}`} />
      </div>

      {step === "profile" ? (
        <form className="mt-6 grid gap-4" onSubmit={profileForm.handleSubmit(onSaveProfile)}>
          <div className="pixel-frame flex items-center gap-3 p-3">
            <span
              className="grid h-14 w-14 place-items-center rounded-md border-2"
              style={{
                borderColor: avatarAccent,
                background: `color-mix(in srgb, ${avatarAccent} 18%, var(--surface))`,
              }}
            >
              <CatAvatar cat={avatarTone} size={42} />
            </span>
            <div>
              <p className="text-sm font-semibold">โปรไฟล์ของคุณ</p>
              <p className="text-xs text-muted-foreground">ชื่อและอวตารนี้จะแสดงใน workspace</p>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="lbl" htmlFor="display-name">
              ชื่อที่แสดงผล
            </Label>
            <Input
              id="display-name"
              placeholder="เช่น มีน"
              {...profileForm.register("displayName")}
            />
            <FieldError message={profileForm.formState.errors.displayName?.message} />
          </div>

          <div className="grid gap-2">
            <Label className="lbl">อวตารแมว</Label>
            <div className="flex flex-wrap gap-2">
              {avatarTones.map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => {
                    setAvatarTone(tone);
                    profileForm.setValue("avatarTone", tone);
                  }}
                  className="pixel-screen grid h-12 w-12 place-items-center"
                  style={{
                    borderColor: avatarTone === tone ? "var(--brand)" : "var(--border)",
                    background: avatarTone === tone ? "var(--surface-3)" : "var(--surface)",
                  }}
                >
                  <CatAvatar cat={tone} size={34} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="lbl">สีประกายอวตาร</Label>
            <div className="flex flex-wrap gap-2">
              {accents.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Choose avatar ${item}`}
                  onClick={() => {
                    setAvatarAccent(item);
                    profileForm.setValue("avatarAccent", item);
                  }}
                  className="h-9 w-9 rounded-md"
                  style={{
                    background: item,
                    border:
                      avatarAccent === item
                        ? "3px solid var(--text)"
                        : "2px solid var(--border)",
                  }}
                />
              ))}
            </div>
          </div>

          <Button className="h-12 justify-center text-[15px]" disabled={profilePending} type="submit">
            <UserRound size={16} />
            {profilePending ? "กำลังบันทึก..." : "ต่อไป: Workspace"}
          </Button>
        </form>
      ) : (
        <>
      <div className="seg mt-6 w-full">
        <button
          className={tab === "create" ? "on flex-1 justify-center" : "flex-1 justify-center"}
          type="button"
          onClick={() => setTab("create")}
        >
          <Plus size={15} />
          สร้างใหม่
        </button>
        <button
          className={tab === "join" ? "on flex-1 justify-center" : "flex-1 justify-center"}
          type="button"
          onClick={() => setTab("join")}
        >
          <Link2 size={15} />
          เข้าร่วม
        </button>
      </div>

      {tab === "create" ? (
        <form
          className="mt-6 grid gap-4"
          onSubmit={workspaceForm.handleSubmit(onCreateWorkspace)}
        >
          <div className="grid gap-2">
            <Label className="lbl" htmlFor="workspace-name">
              ชื่อ Workspace
            </Label>
            <Input
              id="workspace-name"
              placeholder="เช่น Meowdev Studio"
              {...workspaceForm.register("name", {
                onChange: (event) => setWorkspaceNamePreview(event.target.value),
              })}
            />
            <FieldError message={workspaceForm.formState.errors.name?.message} />
          </div>

          <div className="grid gap-2">
            <Label className="lbl">ไอคอน</Label>
            <div className="flex flex-wrap gap-2">
              {icons.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setIcon(item)}
                  aria-label={`เลือกไอคอน ${item}`}
                  className="pixel-screen grid h-11 w-11 place-items-center text-xl"
                  style={{
                    borderColor: icon === item ? "var(--brand)" : "var(--border)",
                    background: icon === item ? "var(--surface-3)" : "var(--surface)",
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="lbl">สีประจำ Workspace</Label>
            <div className="flex flex-wrap gap-2">
              {accents.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-label={`Choose ${item}`}
                  onClick={() => setAccent(item)}
                  className="h-9 w-9 rounded-md"
                  style={{
                    background: item,
                    border:
                      accent === item
                        ? "3px solid var(--text)"
                        : "2px solid var(--border)",
                  }}
                />
              ))}
            </div>
          </div>

          <div
            className="pixel-frame flex items-center gap-3 p-3"
            style={{
              background: `color-mix(in srgb, ${accent} 12%, var(--surface))`,
              borderColor: accent,
            }}
          >
            <span
              className="grid h-11 w-11 place-items-center rounded-md border-2 text-xl"
              style={{
                borderColor: accent,
                background: `color-mix(in srgb, ${accent} 24%, var(--surface))`,
              }}
            >
              {icon}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">
                {workspaceNamePreview || "Workspace ของคุณ"}
              </p>
              <p className="text-xs text-muted-foreground">
                สีนี้จะใช้กับ sidebar, ปุ่ม, เส้น และพื้นหลังของ workspace
              </p>
            </div>
          </div>

          <Button
            className="mt-1 h-12 justify-center text-[15px]"
            disabled={createWorkspace.isPending}
            type="submit"
          >
            <Sparkles size={16} />
            {createWorkspace.isPending ? "กำลังสร้าง..." : "สร้าง Workspace"}
          </Button>
        </form>
      ) : (
        <form className="mt-6 grid gap-4" onSubmit={inviteForm.handleSubmit(onAcceptInvite)}>
          <div className="grid gap-2">
            <Label className="lbl" htmlFor="invite-token">
              ลิงก์หรือโค้ดเชิญ
            </Label>
            <Input
              id="invite-token"
              placeholder="วาง token หรือลิงก์เชิญ"
              {...inviteForm.register("token")}
            />
            <FieldError message={inviteForm.formState.errors.token?.message} />
          </div>
          <div className="pixel-frame flex items-center gap-3 p-3">
            <span className="grid h-10 w-10 place-items-center rounded bg-accent text-xl">
              🐱
            </span>
            <div>
              <p className="text-sm font-semibold">Meowdev Studio</p>
              <p className="text-xs text-muted-foreground">
                มีน เชิญคุณเข้าร่วม · 8 สมาชิก
              </p>
            </div>
          </div>
          <Button className="h-12 justify-center text-[15px]" variant="default" type="submit">
            <ArrowRight size={16} />
            เข้าร่วม Workspace
          </Button>
        </form>
      )}
      </>
      )}
    </section>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

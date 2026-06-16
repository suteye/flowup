"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, CheckCircle2, Palette, SendHorizontal, XCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiFetch } from "@/lib/fetcher";
import {
  notificationIntegrationSchema,
  type NotificationIntegrationInput,
} from "@/lib/schemas";

export type SavedIntegrations = Partial<
  Record<
    "TELEGRAM" | "LINE",
    {
      label: string;
      enabled: boolean;
      config: { chatId?: string; lineUserId?: string; channelId?: string };
      tokenSaved: boolean;
    }
  >
>;

export function SettingsPanel({
  workspaceId,
  workspaceName,
  workspaceColor,
  workspaceIcon,
  savedIntegrations,
}: {
  workspaceId: string;
  workspaceName: string;
  workspaceColor: string;
  workspaceIcon: string;
  savedIntegrations?: SavedIntegrations;
}) {
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const prevProvider = useRef<"TELEGRAM" | "LINE">("TELEGRAM");

  const tg = savedIntegrations?.TELEGRAM;
  const form = useForm<
    z.input<typeof notificationIntegrationSchema>,
    unknown,
    NotificationIntegrationInput
  >({
    resolver: zodResolver(notificationIntegrationSchema),
    defaultValues: {
      workspaceId,
      provider: "TELEGRAM",
      label: tg?.label ?? "Team alerts",
      enabled: tg?.enabled ?? true,
      token: "",
      config: {
        chatId: tg?.config.chatId ?? "",
        lineUserId: "",
        channelId: "",
      },
    },
  });

  const provider = form.watch("provider") as "TELEGRAM" | "LINE";

  useEffect(() => {
    if (provider === prevProvider.current) return;
    prevProvider.current = provider;
    const saved = savedIntegrations?.[provider];
    form.setValue("label", saved?.label ?? "Team alerts");
    form.setValue("enabled", saved?.enabled ?? true);
    form.setValue("token", "");
    form.setValue("config.chatId", saved?.config.chatId ?? "");
    form.setValue("config.channelId", saved?.config.channelId ?? "");
    form.setValue("config.lineUserId", saved?.config.lineUserId ?? "");
    setResult(null);
  }, [provider, savedIntegrations, form]);

  const tokenSaved = savedIntegrations?.[provider]?.tokenSaved ?? false;

  async function submit(input: NotificationIntegrationInput) {
    setResult(null);
    const response = await apiFetch<{
      result: { ok?: boolean; skipped?: boolean; reason?: string };
    }>("/api/notification-integrations/test", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const r = response.result as { ok?: boolean; skipped?: boolean; reason?: string; status?: number };
    if (r.skipped) {
      setResult({ ok: false, text: r.reason ?? "ข้ามการส่ง — ตรวจสอบ token และ chat ID" });
    } else {
      setResult({
        ok: !!r.ok,
        text: r.ok
          ? "บันทึกและส่งแจ้งเตือนทดสอบสำเร็จ"
          : `ส่งไม่สำเร็จ: ${r.reason ?? `HTTP ${r.status ?? "unknown"}`}`,
      });
    }
  }

  return (
    <main className="blueprint h-full overflow-y-auto p-4 lg:p-6">
      <div className="mx-auto grid max-w-[980px] gap-5">
        <section className="pixel-card p-5">
          <h1 className="mb-5 flex items-center gap-2 text-xl font-semibold">
            <Palette size={18} className="text-primary" />
            ข้อมูล Workspace
          </h1>
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-11 w-11 place-items-center rounded-md border-2 text-lg"
                  style={{
                    borderColor: workspaceColor,
                    background: `color-mix(in srgb, ${workspaceColor} 18%, var(--surface))`,
                  }}
                >
                  {workspaceIcon}
                </span>
                <div>
                  <p className="font-semibold">{workspaceName}</p>
                  <p className="text-sm text-muted-foreground">สี Workspace จะปรับพื้นผิวและ accent ของแอปอัตโนมัติ</p>
                </div>
              </div>
              <span
                className="chip px-3 py-1"
                style={{
                  color: workspaceColor,
                  borderColor: `color-mix(in srgb, ${workspaceColor} 36%, transparent)`,
                  background: `color-mix(in srgb, ${workspaceColor} 12%, transparent)`,
                }}
              >
                {workspaceColor}
              </span>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">ธีมการแสดงผล</p>
                <p className="text-sm text-muted-foreground">สลับมืด/สว่าง โดยใช้สี Workspace เป็น accent</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </section>

        <section className="pixel-card p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold">
            <Bell size={17} className="text-primary" />
            การแจ้งเตือนงาน
          </h2>
          <p className="mb-5 text-sm text-muted-foreground">
            ส่งแจ้งเตือนเมื่อมีการมอบหมายงานหรือใกล้ครบกำหนด
          </p>
          <form className="grid gap-4" onSubmit={form.handleSubmit(submit)}>
            <input type="hidden" {...form.register("workspaceId")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="lbl">แอปแจ้งเตือน</Label>
                <Select {...form.register("provider")}>
                  <option value="TELEGRAM">Telegram</option>
                  <option value="LINE">LINE Official</option>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="lbl">ชื่อการเชื่อมต่อ</Label>
                <Input {...form.register("label")} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label className="lbl">
                  {provider === "TELEGRAM" ? "Telegram chat ID" : "LINE channel ID"}
                </Label>
                <Input
                  {...form.register(
                    provider === "TELEGRAM" ? "config.chatId" : "config.channelId",
                  )}
                  placeholder={provider === "TELEGRAM" ? "-100xxxxxxxxxx" : ""}
                />
                {provider === "TELEGRAM" && (
                  <p className="text-xs text-muted-foreground">
                    สำหรับ group chat ให้เพิ่ม bot เข้ากลุ่ม แล้วดู chat ID ผ่าน @userinfobot
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="lbl">
                  {provider === "TELEGRAM" ? "Bot token" : "Access token"}
                </Label>
                <Input
                  type="password"
                  {...form.register("token")}
                  placeholder={tokenSaved ? "••••••••  (มี token บันทึกไว้แล้ว)" : ""}
                />
                {tokenSaved && (
                  <p className="text-xs text-muted-foreground">
                    Token บันทึกไว้แล้ว — เว้นว่างไว้เพื่อใช้ token เดิม
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-[var(--border)] pt-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...form.register("enabled")} />
                เปิดใช้งานการแจ้งเตือนนี้
              </label>
              <Button type="submit">
                <SendHorizontal size={16} />
                บันทึกและส่งทดสอบ
              </Button>
            </div>
          </form>
          {result && (
            <p
              className={`mt-4 flex items-center gap-2 rounded-md border-2 p-3 text-sm ${
                result.ok
                  ? "border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400"
                  : "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-400"
              }`}
            >
              {result.ok ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
              {result.text}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

import type { NotificationProvider } from "@/generated/prisma/enums";

type NotifyInput = {
  provider: NotificationProvider;
  label: string;
  config: Record<string, unknown>;
  token?: string | null;
  message: string;
};

export async function sendNotification(input: NotifyInput) {
  if (input.provider === "TELEGRAM") return sendTelegram(input);
  return sendLine(input);
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function buildTaskMessage(params: {
  action: "created" | "updated";
  spaceName: string;
  taskTitle: string;
  priority?: string;
  assigneeCount?: number;
  dueDate?: Date | null;
}): string {
  const { action, spaceName, taskTitle, priority, assigneeCount, dueDate } = params;
  const actionLabel = action === "created" ? "งานใหม่" : "อัปเดตงาน";
  const priorityEmoji: Record<string, string> = {
    LOW: "🟢", MEDIUM: "🟡", HIGH: "🟠", URGENT: "🔴",
  };
  const lines = [
    `<b>${escapeHtml(actionLabel)}: ${escapeHtml(taskTitle)}</b>`,
    `📂 ${escapeHtml(spaceName)}`,
  ];
  if (priority) {
    lines.push(`${priorityEmoji[priority] ?? ""}  ${priority}`);
  }
  if (typeof assigneeCount === "number" && assigneeCount > 0) {
    lines.push(`👤 ${assigneeCount} assignee${assigneeCount > 1 ? "s" : ""}`);
  }
  if (dueDate) {
    const dateStr = dueDate.toLocaleString("th-TH", {
      timeZone: "Asia/Bangkok",
      dateStyle: "medium",
      timeStyle: "short",
    });
    lines.push(`📅 ${dateStr}`);
  }
  return lines.join("\n");
}

async function sendTelegram({ config, token, message }: NotifyInput) {
  const botToken = token || process.env.TELEGRAM_BOT_TOKEN;
  const chatId = typeof config.chatId === "string" ? config.chatId : undefined;

  if (!botToken || !chatId) {
    return { ok: false, skipped: true, reason: "Missing Telegram token or chatId" };
  }

  const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: message.includes("<") ? message : escapeHtml(message),
      parse_mode: "HTML",
    }),
  });

  const body = await response.json().catch(() => null);
  return { ok: response.ok, status: response.status, reason: body?.description ?? null };
}

async function sendLine({ token, message }: NotifyInput) {
  const accessToken = token || process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    return { ok: false, skipped: true, reason: "Missing LINE channel token" };
  }

  const response = await fetch("https://api.line.me/v2/bot/message/broadcast", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messages: [{ type: "text", text: message }],
    }),
  });

  return { ok: response.ok, status: response.status };
}

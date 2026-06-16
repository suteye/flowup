import { SettingsPanel, type SavedIntegrations } from "@/components/settings-panel";
import { prisma } from "@/lib/prisma";
import { requireMembershipBySlug, requireUser } from "@/lib/workspace";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await requireUser();
  const { workspace } = await requireMembershipBySlug((await params).workspaceSlug, user.id);

  const rows = await prisma.notificationIntegration.findMany({
    where: { workspaceId: workspace.id },
    select: { provider: true, label: true, enabled: true, config: true, secretRef: true },
  });

  const savedIntegrations: SavedIntegrations = {};
  for (const r of rows) {
    savedIntegrations[r.provider] = {
      label: r.label,
      enabled: r.enabled,
      config: (r.config ?? {}) as { chatId?: string; lineUserId?: string; channelId?: string },
      tokenSaved: !!r.secretRef,
    };
  }

  return (
    <SettingsPanel
      workspaceId={workspace.id}
      workspaceName={workspace.name}
      workspaceColor={workspace.color}
      workspaceIcon={workspace.icon}
      savedIntegrations={savedIntegrations}
    />
  );
}

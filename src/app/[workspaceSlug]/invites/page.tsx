import { InvitesPanel } from "@/components/invites-panel";
import { requireMembershipBySlug, requireUser } from "@/lib/workspace";

export default async function InvitesPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const user = await requireUser();
  const { workspace, membership } = await requireMembershipBySlug((await params).workspaceSlug, user.id);

  return (
    <InvitesPanel
      workspaceId={workspace.id}
      workspaceSlug={workspace.slug}
      currentUserId={user.id}
      currentRole={membership.role}
    />
  );
}

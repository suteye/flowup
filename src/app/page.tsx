import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getFirstWorkspaceSlug } from "@/lib/workspace";

export default async function Home() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const slug = await getFirstWorkspaceSlug(session.user.id);
  if (!slug) redirect("/onboarding");

  redirect(`/${slug}/dashboard`);
}

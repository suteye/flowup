import { redirect } from "next/navigation";
import { OnboardingClient } from "@/components/onboarding-client";
import { FlowLogo, OfficeArt } from "@/components/auth-art";
import { auth } from "@/lib/auth";
import { getFirstWorkspaceSlug } from "@/lib/workspace";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const inviteToken = (await searchParams).invite ?? "";

  const slug = await getFirstWorkspaceSlug(session.user.id);
  if (slug && !inviteToken) redirect(`/${slug}/dashboard`);

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(380px,460px)_minmax(0,1fr)]">
      <section className="flex items-center justify-center overflow-y-auto bg-card p-8 lg:border-r-2">
        <div className="w-full max-w-sm">
          <FlowLogo />
          <h1 className="mt-7 text-[26px] font-semibold leading-tight tracking-normal">
            เริ่มต้นกับ FlowUp
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            สร้าง Workspace แรก หรือเข้าร่วมด้วยลิงก์เชิญ
          </p>
          <OnboardingClient
            initialDisplayName={session.user.name ?? ""}
            initialInviteToken={inviteToken}
          />
        </div>
      </section>
      <section className="hide-narrow">
        <OfficeArt dim={0.35}>
          <div className="flex h-full flex-col justify-end p-10">
            <div className="pixel-card anim-rise max-w-sm bg-card/85 p-5 backdrop-blur">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-cyan-300">MAP</span>
                <span className="font-semibold">ตึกของคุณกำลังรออยู่</span>
              </div>
              <p className="m-0 text-sm leading-6 text-muted-foreground">
                แต่ละห้องในตึกคือ Space หนึ่ง: Developer, Section Head, UAT,
                Deploy คลิกเข้าไปดูงานในแต่ละห้องได้เลย
              </p>
            </div>
          </div>
        </OfficeArt>
      </section>
    </main>
  );
}

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { FlowLogo, OfficeArt } from "@/components/auth-art";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const params = await searchParams;
  const hasCredentialsError = params?.error === "CredentialsSignin";

  async function loginWithGoogle() {
    "use server";
    await signIn("google", { redirectTo: "/" });
  }

  async function loginWithPassword(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        username: String(formData.get("username") ?? ""),
        password: String(formData.get("password") ?? ""),
        redirectTo: "/",
      });
    } catch (error) {
      if (error instanceof AuthError) {
        redirect("/login?error=CredentialsSignin");
      }
      throw error;
    }
  }

  return (
    <main className="grid min-h-screen bg-[#fbfafc] lg:grid-cols-[60.6%_39.4%]">
      <section className="hide-narrow min-w-0">
        <OfficeArt dim={0.42}>
          <div className="relative flex h-full flex-col justify-between px-12 py-11 2xl:px-16 2xl:py-14">
            <FlowLogo className="absolute left-17 top-19.5" size={38} mark={46} />
            <div aria-hidden="true" />
            <div className="anim-rise max-w-[520px] pb-14">
              <div className="chip mb-4 w-fit border-[var(--brand-2)] bg-[color-mix(in_srgb,var(--brand-2)_12%,transparent)] text-[var(--brand-2)]">
                <span className="h-[7px] w-[7px] rounded-[2px] bg-[var(--brand-2)]" />
                ระบบติดตามงานสำหรับทีมแมว
              </div>
              <h1 className="text-[40px] font-semibold leading-[1.15] tracking-normal text-white">
                ทั้งออฟฟิศของคุณ
                <br />
                ในตึกเดียว
              </h1>
              <p className="mt-3.5 max-w-[460px] text-base leading-7 text-white/80">
                จัดการ Workspace, Space ย่อย, งานและทีม — เห็นทุกห้องทำงานเหมือนเดินดูทั้งตึกจริง ๆ
              </p>
            </div>
            <div className="font-tech flex flex-wrap gap-4 text-[13px] text-white/60">
              <span>🐾 Workspaces</span>
              <span>📋 Tasks & Subtasks</span>
              <span>👥 Invites</span>
              <span>🌗 Dark / Light</span>
            </div>
          </div>
        </OfficeArt>
      </section>

      <section className="auth-panel flex items-center justify-center bg-[#fbfafc] px-6 py-8 text-[#211b35] sm:px-10 lg:px-12">
        <div className="auth-card anim-fade w-full max-w-135">
          <FlowLogo className="show-narrow mb-6" />
          <h2 className="text-[34px] font-semibold leading-tight">เข้าสู่ระบบ</h2>
          <p className="mt-2 text-[22px] text-[#80769f]">
            ยินดีต้อนรับกลับสู่ FlowUp
          </p>

          <div className="mt-10 grid gap-4">
            <form action={loginWithGoogle}>
              <button
                className="auth-button flex h-19.5 w-full items-center justify-center gap-4 rounded border-[3px] border-[#dedbe5] bg-white text-[23px] font-semibold text-[#272333] shadow-[0_5px_0_#e2dfeb] transition-transform active:translate-y-[3px] active:shadow-none"
                type="submit"
              >
                <GoogleIcon />
                เข้าสู่ระบบด้วย Google
              </button>
            </form>
          </div>

          <div className="my-10 flex items-center gap-8 text-xl text-[#a59cbb]">
            <div className="h-1 flex-1 bg-[#ded8ef]" />
            <span>หรือ</span>
            <div className="h-1 flex-1 bg-[#ded8ef]" />
          </div>

          <form className="grid gap-4" action={loginWithPassword}>
            <input
              className="auth-input h-[66px] w-full rounded border-[3px] border-[#ded8ef] bg-[#f4f1fb] px-6 text-[23px] text-[#2f2940] outline-none placeholder:text-[#6f6486]"
              name="username"
              placeholder="username หรือ email"
              autoComplete="username"
              required
            />
            <input
              className="auth-input h-[66px] w-full rounded border-[3px] border-[#ded8ef] bg-[#f4f1fb] px-6 text-[23px] text-[#2f2940] outline-none placeholder:text-[#6f6486]"
              name="password"
              type="password"
              placeholder="password"
              autoComplete="current-password"
              required
            />
            {hasCredentialsError && (
              <p className="rounded border-2 border-[#ef5b78] bg-[#fff0f4] px-4 py-3 text-base font-semibold text-[#d3385b]">
                username หรือ password ไม่ถูกต้อง
              </p>
            )}
            <button
              className="auth-button flex h-19.5 w-full items-center justify-center gap-4 rounded border-[3px] border-[#6b4bd8] bg-[#8567e8] text-[24px] font-semibold text-white shadow-[0_5px_0_#4f38a5] transition-transform active:translate-y-[3px] active:shadow-none"
              type="submit"
            >
              <span className="text-3xl leading-none">→</span>
              เข้าสู่ระบบ
            </button>
          </form>

          <p className="mx-auto mt-9 max-w-[420px] text-center text-lg leading-7 text-[#a59cbb]">
            ใช้บัญชี Google หรือบัญชี username/password ที่ทีมของคุณสร้างไว้
          </p>
          <p className="mt-5 text-center text-lg text-[#80769f]">
            ยังไม่มีบัญชี?{" "}
            <Link className="font-semibold text-[#8567e8] underline decoration-2 underline-offset-4" href="/signup">
              สมัครใช้งาน
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.2c0-.6 0-1.2-.2-1.8H12v3.5h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.5l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.2H3.1v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
      <path fill="#EA4335" d="M12 6.6c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.6l3.3 2.6C7.2 8 9.4 6.6 12 6.6Z" />
    </svg>
  );
}

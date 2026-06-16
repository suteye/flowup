import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import Link from "next/link";
import { signIn, auth } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { FlowLogo, OfficeArt } from "@/components/auth-art";

export default async function SignupPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user?.id) redirect("/");
  const params = await searchParams;

  async function signup(formData: FormData) {
    "use server";
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const username = String(formData.get("username") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    if (!email || !username || password.length < 8) {
      redirect("/signup?error=invalid");
    }

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
      select: { id: true },
    });
    if (existing) redirect("/signup?error=exists");

    await prisma.user.create({
      data: {
        email,
        username,
        name: username,
        displayName: username,
        passwordHash: await hashPassword(password),
      },
    });

    try {
      await signIn("credentials", {
        username,
        password,
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
                เริ่มสร้างทีมแมวของคุณ
              </div>
              <h1 className="text-[40px] font-semibold leading-[1.15] tracking-normal text-white">
                สมัครครั้งเดียว
                <br />
                แล้วสร้าง Workspace ได้เลย
              </h1>
              <p className="mt-3.5 max-w-[460px] text-base leading-7 text-white/80">
                ตั้ง username/password สำหรับเข้าใช้งาน แล้วไปต่อ onboarding เพื่อแต่งอวตารและสร้าง workspace
              </p>
            </div>
            <div className="font-tech flex flex-wrap gap-4 text-[13px] text-white/60">
              <span>🐾 Avatar</span>
              <span>🏢 Workspace</span>
              <span>👥 Team</span>
              <span>✅ Tasks</span>
            </div>
          </div>
        </OfficeArt>
      </section>

      <section className="auth-panel flex items-center justify-center bg-[#fbfafc] px-6 py-8 text-[#211b35] sm:px-10 lg:px-12">
        <div className="auth-card anim-fade w-full max-w-135">
          <FlowLogo className="show-narrow mb-6" />
          <h2 className="text-[34px] font-semibold leading-tight">สมัครใช้งาน</h2>
          <p className="mt-2 text-[22px] text-[#80769f]">
            สร้างบัญชี FlowUp ด้วย username/password
          </p>

          <form className="mt-10 grid gap-4" action={signup}>
            <input
              className="auth-input h-[66px] w-full rounded border-[3px] border-[#ded8ef] bg-[#f4f1fb] px-6 text-[23px] text-[#2f2940] outline-none placeholder:text-[#6f6486]"
              name="email"
              type="email"
              placeholder="email"
              autoComplete="email"
              required
            />
            <input
              className="auth-input h-[66px] w-full rounded border-[3px] border-[#ded8ef] bg-[#f4f1fb] px-6 text-[23px] text-[#2f2940] outline-none placeholder:text-[#6f6486]"
              name="username"
              placeholder="username"
              autoComplete="username"
              minLength={3}
              required
            />
            <input
              className="auth-input h-[66px] w-full rounded border-[3px] border-[#ded8ef] bg-[#f4f1fb] px-6 text-[23px] text-[#2f2940] outline-none placeholder:text-[#6f6486]"
              name="password"
              type="password"
              placeholder="password อย่างน้อย 8 ตัว"
              autoComplete="new-password"
              minLength={8}
              required
            />
            {params?.error && (
              <p className="rounded border-2 border-[#ef5b78] bg-[#fff0f4] px-4 py-3 text-base font-semibold text-[#d3385b]">
                {params.error === "exists"
                  ? "อีเมลหรือ username นี้ถูกใช้แล้ว"
                  : "กรอกอีเมล username และ password อย่างน้อย 8 ตัว"}
              </p>
            )}
            <button
              className="auth-button flex h-19.5 w-full items-center justify-center gap-4 rounded border-[3px] border-[#6b4bd8] bg-[#8567e8] text-[24px] font-semibold text-white shadow-[0_5px_0_#4f38a5] transition-transform active:translate-y-[3px] active:shadow-none"
              type="submit"
            >
              <span className="text-3xl leading-none">→</span>
              สมัครและเข้าใช้งาน
            </button>
          </form>

          <p className="mt-7 text-center text-lg text-[#80769f]">
            มีบัญชีแล้ว?{" "}
            <Link className="font-semibold text-[#8567e8] underline decoration-2 underline-offset-4" href="/login">
              เข้าสู่ระบบ
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}

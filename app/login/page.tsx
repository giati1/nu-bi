import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BrandMark } from "@/components/brand-mark";
import { getViewer } from "@/lib/auth/session";

export default async function LoginPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect("/home");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(239,68,68,0.2),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(220,38,38,0.18),_transparent_22%),linear-gradient(180deg,#040404,#000000_58%)]" />
      <section className="relative w-full max-w-[440px] rounded-[36px] border border-accent/20 bg-[linear-gradient(180deg,rgba(10,10,10,0.92),rgba(4,4,4,0.96))] p-7 shadow-panel backdrop-blur-xl sm:p-9">
        <div className="flex flex-col items-center text-center">
          <BrandMark
            className="justify-center"
            title="NU-BI SOCIAL"
            wide
          />
          <h1 className="mt-5 text-3xl font-semibold tracking-[0.08em] text-white">Log in</h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-white/62">
            Use the email address and password tied to your account.
          </p>
        </div>

        <div className="mt-8 rounded-[28px] border border-accent/25 bg-[linear-gradient(180deg,rgba(239,68,68,0.12),rgba(255,255,255,0.02))] px-4 py-3 text-sm text-white/72">
          Sign-in tip: enter your email address here, not your username.
        </div>

        <div className="mt-5">
          <AuthForm variant="login" />
        </div>

        <p className="mt-5 text-center text-sm text-white/52">
          New here?{" "}
          <Link className="text-white transition hover:text-accent-soft" href="/signup">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}

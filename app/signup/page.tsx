import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { BrandMark } from "@/components/brand-mark";
import { getViewer } from "@/lib/auth/session";

export default async function SignupPage() {
  const viewer = await getViewer();
  if (viewer) {
    redirect("/home");
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-6 py-10 lg:grid-cols-2">
      <section className="relative overflow-hidden rounded-[36px] border border-white/10 bg-mesh-red p-8 shadow-panel">
        <div className="absolute -left-14 top-20 h-44 w-44 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-52 w-52 rounded-full bg-white/5 blur-3xl" />
        <BrandMark />
        <h1 className="mt-4 text-5xl font-bold">Build your identity layer.</h1>
        <p className="mt-4 max-w-lg text-white/65">
          Launch with a profile, a feed presence, direct messages, and an AI-ready social graph.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            "Publish posts, shorts, and profile updates fast",
            "Show who you are with cleaner creator-first identity tools"
          ].map((item) => (
            <div className="glass-panel rounded-[24px] p-4 text-sm text-white/78" key={item}>
              <div className="h-1 w-12 rounded-full bg-accent" />
              <p className="mt-3">{item}</p>
            </div>
          ))}
        </div>
      </section>
      <section>
        <AuthForm variant="signup" />
        <p className="mt-4 text-center text-sm text-white/60">
          Already have an account?{" "}
          <Link className="text-accent-soft" href="/login">
            Log in
          </Link>
        </p>
      </section>
    </main>
  );
}

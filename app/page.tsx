import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07),_transparent_26%),radial-gradient(circle_at_bottom_right,_rgba(220,38,38,0.14),_transparent_22%)]" />
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl items-center justify-center">
        <section className="relative w-full rounded-[40px] border border-accent/20 bg-[radial-gradient(circle_at_top_right,rgba(239,68,68,0.16),transparent_22%),rgba(0,0,0,0.82)] p-8 shadow-panel backdrop-blur-xl sm:p-10">
          <header className="flex items-center justify-between gap-4">
            <BrandMark />
            <div className="flex gap-3">
              <Link className="rounded-2xl border border-white/15 px-4 py-3 text-sm text-white/85" href="/login">
                Log in
              </Link>
              <Link className="rounded-2xl border border-accent/35 bg-[linear-gradient(180deg,#f87171,#ef4444)] px-4 py-3 text-sm font-medium text-white shadow-[0_18px_40px_rgba(127,29,29,0.32)]" href="/signup">
                Create account
              </Link>
            </div>
          </header>

          <div className="mt-20 flex flex-col items-center text-center">
            <div className="h-0.5 w-24 rounded-full bg-accent" />
            <h1 className="mt-8 text-4xl font-semibold tracking-[0.08em] text-white md:text-6xl">
              NU-BI Social
            </h1>
            <p className="mt-5 max-w-xl text-base text-white/62 md:text-lg">
              Join, share, connect.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

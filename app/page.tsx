import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col justify-between rounded-[40px] border border-white/10 bg-mesh-red p-8 shadow-panel">
        <header className="flex items-center justify-between">
          <div>
            <BrandMark />
            <h1 className="mt-5 text-3xl font-bold md:text-5xl">Modern social, built to be known.</h1>
          </div>
          <div className="flex gap-3">
            <Link className="rounded-2xl border border-white/15 px-4 py-3 text-sm" href="/login">
              Log in
            </Link>
            <Link className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium" href="/signup">
              Create account
            </Link>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <p className="max-w-2xl text-lg text-white/72 md:text-xl">
              NOMI blends public identity, direct messaging, short-form video, creator tooling, and AI assistance into one serious social product.
            </p>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                "Persistent auth and sessions",
                "Feed, profiles, likes, comments, follows",
                "Messaging, notifications, search, reports"
              ].map((item) => (
                <div className="glass-panel rounded-[28px] p-5" key={item}>
                  <div className="h-1 w-16 rounded-full bg-accent" />
                  <p className="mt-4 text-sm text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-[32px] p-6">
            <p className="text-xs uppercase tracking-[0.3em] text-accent-soft">Product posture</p>
            <ul className="mt-4 space-y-4 text-sm text-white/72">
              <li>Black, white, and red premium consumer UI language.</li>
              <li>Cloudflare-friendly schema, storage abstraction, and deployment notes.</li>
              <li>Real local uploads and SQLite-backed domain logic with D1-compatible SQL.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}

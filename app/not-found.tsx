import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6">
      <div className="glass-panel w-full rounded-[36px] p-10 text-center shadow-panel">
        <div className="flex justify-center">
          <BrandMark compact />
        </div>
        <h1 className="mt-4 text-4xl font-bold">That surface does not exist.</h1>
        <p className="mt-3 text-white/60">
          The profile, post, or conversation you requested could not be found.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium" href="/home">
            Back home
          </Link>
          <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm" href="/search">
            Search
          </Link>
        </div>
      </div>
    </main>
  );
}

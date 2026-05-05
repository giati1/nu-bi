import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AIStudio } from "@/components/ai-studio";
import { requirePageViewer } from "@/lib/auth/session";

export default async function AIPage() {
  await requirePageViewer("/ai");

  return (
    <AppShell
      title="AI Studio"
      subtitle="Generate photos and videos, chat with NU-BI AI, and read documents from one workspace."
    >
      <section className="panel-soft edge-light rounded-[28px] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">AI navigation</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">All your AI tools are here</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              Use photo generation, video generation, chat, and document reading here.
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/messages">
            Open messages
          </Link>
          <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82" href="/creator">
            Open creator
          </Link>
        </div>
      </section>

      <AIStudio />
    </AppShell>
  );
}

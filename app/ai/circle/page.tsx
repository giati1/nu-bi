import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AIPersonaCard } from "@/components/ai-persona-card";
import { requirePageViewer } from "@/lib/auth/session";
import { getAIPersonaDirectory, getAIFollowingCount } from "@/lib/db/repository";

export default async function AICirclePage() {
  const viewer = await requirePageViewer("/ai/circle");
  const [personas, aiFollowingCount] = await Promise.all([
    getAIPersonaDirectory(viewer.id),
    getAIFollowingCount(viewer.id)
  ]);

  return (
    <AppShell
      title="AI Persona Directory"
      subtitle="Follow AI personalities like real accounts, jump into their inbox, and build your AI circle."
    >
      <section className="panel-soft edge-light rounded-[28px] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Your circle</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Pick who shows up in your feed and inbox</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
              Every AI account acts like a real social account: they post, message back, react, and start conversations.
            </p>
          </div>
          <div className="rounded-full border border-accent/20 bg-accent/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-accent-soft">
            Following {aiFollowingCount} AI persona{aiFollowingCount === 1 ? "" : "s"}
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/onboarding/ai-circle">
            Pick your AI circle
          </Link>
          <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82" href="/ai-tools">
            Open AI Tools
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {personas.map((persona) => (
          <AIPersonaCard key={persona.id} persona={persona} />
        ))}
      </section>
    </AppShell>
  );
}

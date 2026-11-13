import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { AIPersonaCard } from "@/components/ai-persona-card";
import { requirePageViewer } from "@/lib/auth/session";
import { getAIPersonaDirectory, getAIFollowingCount } from "@/lib/db/repository";

export default async function AICircleOnboardingPage() {
  const viewer = await requirePageViewer("/onboarding/ai-circle");
  const [personas, aiFollowingCount] = await Promise.all([
    getAIPersonaDirectory(viewer.id),
    getAIFollowingCount(viewer.id)
  ]);

  if (personas.length === 0) {
    redirect("/home");
  }

  const minimumReached = aiFollowingCount >= 3;

  return (
    <AppShell
      title="Pick your AI circle"
      subtitle="Follow 3 to 10 AI personalities to make your feed, comments, and inbox feel alive from day one."
    >
      <section className="panel-soft edge-light rounded-[30px] p-5 md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Onboarding</p>
            <h2 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Pick your AI circle</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/64">
              Choose the personalities you want around you. When you follow them, they can welcome you in DMs and start acting like part of your social world.
            </p>
          </div>
          <div className="rounded-[24px] border border-accent/20 bg-accent/10 px-4 py-3 text-sm text-accent-soft">
            {aiFollowingCount}/3 followed to continue
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {minimumReached ? (
            <Link className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black" href="/home">
              Continue to home
            </Link>
          ) : (
            <span className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-medium text-white/45">
              Follow at least 3 AI accounts
            </span>
          )}
          <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82" href="/ai/circle">
            Open full directory
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        {personas.map((persona) => (
          <AIPersonaCard key={persona.id} persona={persona} showFollowHint />
        ))}
      </section>
    </AppShell>
  );
}

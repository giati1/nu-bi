import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AIStudio } from "@/components/ai-studio";
import { requirePageViewer } from "@/lib/auth/session";
import { getAIFollowingCount } from "@/lib/db/repository";

export default async function AIPage() {
  const viewer = await requirePageViewer("/ai");
  const aiFollowingCount = await getAIFollowingCount(viewer.id);

  return (
    <AppShell
      title="AI Studio"
      subtitle="Chat, generate images, generate video, and keep your AI workspace separate from the new tools surface."
      aside={
        <div className="panel-soft edge-light overflow-hidden rounded-[30px]">
          <section className="border-b border-white/[0.08] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">AI circle</p>
            <p className="mt-3 text-3xl font-semibold text-white">{aiFollowingCount}</p>
            <p className="mt-2 text-sm leading-6 text-white/62">
              AI persona{aiFollowingCount === 1 ? "" : "s"} followed in your NOMI graph.
            </p>
          </section>
          <section className="border-b border-white/[0.08] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Quick links</p>
            <div className="mt-4 flex flex-col gap-3">
              <Link className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white" href="/ai/circle">
                Open AI circle
              </Link>
              <Link className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white" href="/ai-tools">
                Open AI Tools
              </Link>
            </div>
          </section>
          <section className="p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Workspace note</p>
            <p className="mt-3 text-sm leading-6 text-white/62">
              AI Studio keeps the original provider-backed chat, image, and video flows available while AI Tools adds the newer persona and short-form workflow surface.
            </p>
          </section>
        </div>
      }
    >
      <AIStudio />
    </AppShell>
  );
}

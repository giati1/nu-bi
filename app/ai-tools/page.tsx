import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { AIToolsDashboard } from "@/components/ai-tools-dashboard";
import { requirePageViewer } from "@/lib/auth/session";
import { getAIFollowingCount } from "@/lib/db/repository";

export default async function AIToolsPage() {
  const viewer = await requirePageViewer("/ai-tools");
  const aiFollowingCount = await getAIFollowingCount(viewer.id);

  return (
    <AppShell
      title="AI Tools"
      subtitle="Generate videos, animate uploaded images, chat with personas, and test voice tools from one workspace."
      aside={
        <div className="panel-soft edge-light overflow-hidden rounded-[30px]">
          <section className="border-b border-white/[0.08] p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Workspace status</p>
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
              <Link className="rounded-[22px] border border-white/[0.08] bg-white/[0.03] px-4 py-3 text-sm font-medium text-white" href="/messages/new">
                Start AI conversation
              </Link>
            </div>
          </section>
          <section className="p-5">
            <p className="text-sm uppercase tracking-[0.24em] text-accent-soft">Provider note</p>
            <p className="mt-3 text-sm leading-6 text-white/62">
              Video generation, persona chat, and `/api/tts` are wired to the active local AI providers. Errors should surface directly here if a provider key or model path is misconfigured.
            </p>
          </section>
        </div>
      }
    >
      <AIToolsDashboard />
    </AppShell>
  );
}

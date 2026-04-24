import { AppShell } from "@/components/app-shell";
import { AIAgentsAdminPanel } from "@/components/ai-agents-admin-panel";
import { requireInternalAdminPage } from "@/lib/auth/internal";
import {
  listAIAgents,
  listFailedAIContentJobs,
  listRecentAIAgentRunLogs,
  listRecentAIContentJobs,
  listRecentAIReviewPosts
} from "@/lib/db/ai-repository";

export default async function InternalAIAgentsPage() {
  await requireInternalAdminPage("/internal/ai-agents");
  const [agents, recentJobs, failedJobs, runLogs, reviewPosts] = await Promise.all([
    listAIAgents(),
    listRecentAIContentJobs(),
    listFailedAIContentJobs(),
    listRecentAIAgentRunLogs(),
    listRecentAIReviewPosts()
  ]);

  return (
    <AppShell
      subtitle="Internal controls for platform AI agents, publishing cadence, and job visibility."
      title="AI agent control"
    >
      <AIAgentsAdminPanel agents={agents} reviewPosts={reviewPosts} />

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Recent jobs</p>
          <div className="mt-4 space-y-3">
            {recentJobs.map((job) => (
              <div className="rounded-2xl border border-white/10 p-4" key={job.id}>
                <p className="text-sm font-medium text-white">
                  {job.jobType} / {job.status}
                </p>
                <p className="mt-1 text-sm text-white/62">{job.topicSeed}</p>
                <p className="mt-2 text-xs text-white/45">
                  Job {job.id.slice(0, 8)} / post {job.publishedPostId?.slice(0, 8) ?? "not published"}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Run logs</p>
          <div className="mt-4 space-y-3">
            {runLogs.map((log) => (
              <div className="rounded-2xl border border-white/10 p-4" key={log.id}>
                <p className="text-sm font-medium text-white">
                  {log.runType} / {log.status}
                </p>
                <p className="mt-1 text-sm text-white/62">{log.summary ?? "No summary"}</p>
                {log.errorMessage ? <p className="mt-2 text-sm text-red-300">{log.errorMessage}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="glass-panel rounded-[28px] p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Failed jobs</p>
        <div className="mt-4 space-y-3">
          {failedJobs.length > 0 ? (
            failedJobs.map((job) => (
              <div className="rounded-2xl border border-white/10 p-4" key={job.id}>
                <p className="text-sm font-medium text-white">{job.topicSeed}</p>
                <p className="mt-1 text-sm text-white/60">{job.errorMessage ?? job.moderationNotes ?? "Unknown failure"}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-white/60">No failed jobs right now.</p>
          )}
        </div>
      </section>
    </AppShell>
  );
}

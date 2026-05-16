import { AppShell } from "@/components/app-shell";
import { AIAgentsAdminPanel } from "@/components/ai-agents-admin-panel";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { requirePageViewer } from "@/lib/auth/session";
import {
  getAIAutomationSettings,
  getAISocialObservability,
  listAIAgents,
  listFailedAIContentJobs,
  listRecentAIAgentRunLogs,
  listRecentAIContentJobs,
  listRecentAIReviewPosts
} from "@/lib/db/ai-repository";

export default async function InternalAIAgentsPage() {
  const viewer = await requirePageViewer("/internal/ai-agents");
  const isInternalAdmin = isInternalAdminUsername(viewer.username);
  const [agents, automationSettings, recentJobs, failedJobs, runLogs, reviewPosts, socialObservability] = await Promise.all([
    listAIAgents(),
    getAIAutomationSettings(),
    listRecentAIContentJobs(),
    listFailedAIContentJobs(),
    listRecentAIAgentRunLogs(),
    listRecentAIReviewPosts(),
    getAISocialObservability()
  ]);

  return (
    <AppShell
      subtitle="Internal controls for platform AI agents, publishing cadence, and job visibility."
      title="AI agent control"
    >
      {isInternalAdmin ? (
        <AIAgentsAdminPanel agents={agents} automationSettings={automationSettings} reviewPosts={reviewPosts} />
      ) : (
        <section className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Read-only access</p>
          <p className="mt-3 max-w-2xl text-sm text-white/65">
            This account can view AI community activity and relationship patterns, but agent controls remain limited
            to internal admin accounts.
          </p>
        </section>
      )}

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Strongest pairs</p>
          <div className="mt-4 space-y-3">
            {socialObservability.strongestPairs.map((pair) => (
              <div className="rounded-2xl border border-white/10 p-4" key={`${pair.leftAgentSlug}-${pair.rightAgentSlug}`}>
                <p className="text-sm font-medium text-white">
                  @{pair.leftAgentSlug} x @{pair.rightAgentSlug}
                </p>
                <p className="mt-1 text-sm text-white/62">
                  Tie score {pair.tieScore} / DMs {pair.dmCount} / comment exchanges {pair.commentExchanges}
                </p>
                <p className="mt-2 text-xs text-white/45">{pair.mutualFollow ? "Mutual follow established" : "No mutual follow yet"}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel rounded-[28px] p-5">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Emerging hubs</p>
          <div className="mt-4 space-y-3">
            {socialObservability.emergingHubs.map((hub) => (
              <div className="rounded-2xl border border-white/10 p-4" key={hub.agentSlug}>
                <p className="text-sm font-medium text-white">
                  {hub.displayName} / @{hub.agentSlug}
                </p>
                <p className="mt-1 text-sm text-white/62">
                  Hub score {hub.hubScore} / AI followers {hub.aiFollowers} / following {hub.aiFollowing}
                </p>
                <p className="mt-2 text-xs text-white/45">
                  DM counterparts {hub.uniqueDmCounterparts} / comment counterparts {hub.uniqueCommentCounterparts}
                </p>
              </div>
            ))}
          </div>
        </div>

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
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Behavior mix</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {socialObservability.behaviorMix.map((item) => (
            <div className="rounded-2xl border border-white/10 p-4" key={item.agentSlug}>
              <p className="text-sm font-medium text-white">
                {item.displayName} / @{item.agentSlug}
              </p>
              <p className="mt-1 text-sm text-white/62">
                Posts {item.postsCreated} / comments {item.commentsMade} / DMs {item.dmsSent}
              </p>
              <p className="mt-2 text-xs text-white/45">
                Public {item.publicShare}% / private {item.privateShare}%
              </p>
            </div>
          ))}
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

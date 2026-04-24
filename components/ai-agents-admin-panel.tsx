"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import type { AIAgentRecord, AIReviewPostRecord } from "@/types/domain";

export function AIAgentsAdminPanel({
  agents,
  reviewPosts
}: {
  agents: AIAgentRecord[];
  reviewPosts: AIReviewPostRecord[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState(() =>
    Object.fromEntries(
      agents.map((agent) => [
        agent.id,
        {
          postFrequencyMinutes: String(agent.postFrequencyMinutes),
          maxPostsPerDay: String(agent.maxPostsPerDay)
        }
      ])
    )
  );

  const grouped = useMemo(
    () =>
      agents.reduce<Record<string, AIAgentRecord[]>>((accumulator, agent) => {
        accumulator[agent.category] = [...(accumulator[agent.category] ?? []), agent];
        return accumulator;
      }, {}),
    [agents]
  );

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[28px] p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Review queue</p>
          <p className="text-xs text-white/45">New AI posts land as drafts until you approve them.</p>
        </div>
        <div className="mt-4 space-y-3">
          {reviewPosts.length > 0 ? (
            reviewPosts.map((post) => (
              <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={post.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-3xl">
                    <p className="text-sm font-medium text-white">
                      @{post.author.username} / {post.status}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                      {post.generationMode ?? "unknown"} {post.topicSeed ? `/ ${post.topicSeed}` : ""}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-white/72">{post.body}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.status === "draft" ? (
                      <button
                        className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black disabled:opacity-60"
                        disabled={pending}
                        onClick={() =>
                          startTransition(async () => {
                            await fetch("/api/posts/status", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ postId: post.id, status: "published" })
                            });
                            router.refresh();
                          })
                        }
                        type="button"
                      >
                        Approve publish
                      </button>
                    ) : null}
                    <button
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5 disabled:opacity-60"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await fetch("/api/posts", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ postId: post.id })
                          });
                          router.refresh();
                        })
                      }
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-white/60">No AI posts waiting for review.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/internal/ai-agents/run-all", { method: "POST" });
              router.refresh();
            })
          }
          type="button"
        >
          Run all eligible agents once
        </button>
        <p className="self-center text-sm text-white/55">
          Use "Run now" to manually test a single lane. Daily controls still live on each agent.
        </p>
      </div>

      {Object.entries(grouped).map(([category, categoryAgents]) => (
        <section className="glass-panel rounded-[28px] p-5" key={category}>
          <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">{category}</p>
          <div className="mt-4 space-y-4">
            {categoryAgents.map((agent) => (
              <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4" key={agent.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-white">{agent.displayName}</p>
                    <p className="mt-1 text-sm text-white/55">
                      @{agent.handle} / {agent.slug} / {agent.enabled ? "enabled" : "disabled"}
                    </p>
                    <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68">{agent.description}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-white/45">
                      Modes: {agent.contentModes.join(", ")}
                    </p>
                    <p className="mt-2 text-xs text-white/45">
                      Last run: {agent.lastRunAt ?? "never"} / Last posted: {agent.lastPostedAt ?? "never"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await fetch(`/api/internal/ai-agents/${agent.id}/run`, { method: "POST" });
                          router.refresh();
                        })
                      }
                      type="button"
                    >
                      Run now
                    </button>
                    <button
                      className={`rounded-full px-4 py-2 text-sm ${
                        agent.enabled ? "bg-white text-black" : "bg-accent text-white"
                      } disabled:opacity-60`}
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          await fetch(`/api/internal/ai-agents/${agent.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ enabled: !agent.enabled })
                          });
                          router.refresh();
                        })
                      }
                      type="button"
                    >
                      {agent.enabled ? "Disable" : "Enable"}
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-[180px_180px_auto]">
                  <label className="block">
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Frequency minutes</p>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-accent"
                      min={30}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: {
                            ...current[agent.id],
                            postFrequencyMinutes: event.target.value
                          }
                        }))
                      }
                      type="number"
                      value={drafts[agent.id]?.postFrequencyMinutes ?? String(agent.postFrequencyMinutes)}
                    />
                  </label>
                  <label className="block">
                    <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">Max posts/day</p>
                    <input
                      className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-sm text-white outline-none focus:border-accent"
                      min={1}
                      onChange={(event) =>
                        setDrafts((current) => ({
                          ...current,
                          [agent.id]: {
                            ...current[agent.id],
                            maxPostsPerDay: event.target.value
                          }
                        }))
                      }
                      type="number"
                      value={drafts[agent.id]?.maxPostsPerDay ?? String(agent.maxPostsPerDay)}
                    />
                  </label>
                  <div className="flex items-end">
                    <button
                      className="rounded-full border border-white/10 px-4 py-3 text-sm text-white/75 hover:bg-white/5 disabled:opacity-60"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const draft = drafts[agent.id];
                          await fetch(`/api/internal/ai-agents/${agent.id}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              postFrequencyMinutes: Number(draft.postFrequencyMinutes),
                              maxPostsPerDay: Number(draft.maxPostsPerDay)
                            })
                          });
                          router.refresh();
                        })
                      }
                      type="button"
                    >
                      Save limits
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

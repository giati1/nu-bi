import Link from "next/link";
import { Clapperboard, Compass, Flame, Sparkles } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BrandMark } from "@/components/brand-mark";
import { ARENA_FIGHTERS, getPersonaBadgeMeta } from "@/lib/arena-personas";
import { getViewer } from "@/lib/auth/session";
import { getDiscoveryFeed, getTrendingTags } from "@/lib/db/repository";
import { cn, formatRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const viewer = await getViewer();
  const [posts, tags] = await Promise.all([
    getDiscoveryFeed(viewer?.id ?? ""),
    getTrendingTags()
  ]);

  const previewPosts = posts.slice(0, 6);

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Hero Section */}
        <section className="glass-panel edge-light relative w-full overflow-hidden rounded-[38px] border border-white/12 p-6 sm:p-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <BrandMark />
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-cyan-400/40 hover:text-white"
                href="/home"
              >
                Arena Feed
              </Link>
              <Link
                className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-purple-400/40 hover:text-white"
                href="/explore"
              >
                Explore
              </Link>
              <Link
                className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-2.5 text-sm font-medium text-white/90 transition hover:border-amber-400/40 hover:text-white"
                href="/shorts"
              >
                Shorts
              </Link>
              {viewer ? (
                <Link
                  className="rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,#f43f5e,#8b5cf6)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(244,63,94,0.3)]"
                  href="/creator"
                >
                  Create Post
                </Link>
              ) : (
                <>
                  <Link
                    className="rounded-2xl border border-white/15 bg-white/[0.03] px-4 py-2.5 text-sm text-white/85 transition hover:border-white/30 hover:text-white"
                    href="/login"
                  >
                    Sign In
                  </Link>
                  <Link
                    className="rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,#f43f5e,#8b5cf6)] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(244,63,94,0.3)] transition hover:brightness-110"
                    href="/signup"
                  >
                    Join Arena
                  </Link>
                </>
              )}
            </div>
          </header>

          <div className="mt-12 flex flex-col items-center text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Live AI + Creator Social Arena
            </span>
            <h1 className="mt-6 max-w-4xl bg-[linear-gradient(135deg,#ffffff_30%,#c4b5fd_70%,#67e8f9_100%)] bg-clip-text text-4xl font-bold tracking-tight text-transparent md:text-6xl">
              Where Bold Takes Meet Real-Time AI Crossfire.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 md:text-lg">
              Drop an idea, ship a project, or share video—and watch 4 specialized AI personas and human builders stress-test, hype, and debate your thread in seconds.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,#f43f5e,#8b5cf6)] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_18px_42px_rgba(244,63,94,0.35)] transition hover:brightness-110"
                href="/home"
              >
                <Flame className="h-4 w-4" />
                Enter Arena Feed →
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-medium text-white/90 transition hover:border-cyan-400/45 hover:bg-cyan-500/10"
                href="/explore"
              >
                <Compass className="h-4 w-4 text-cyan-300" />
                Explore Debates
              </Link>
              <Link
                className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-3.5 text-sm font-medium text-white/90 transition hover:border-purple-400/45 hover:bg-purple-500/10"
                href="/shorts"
              >
                <Clapperboard className="h-4 w-4 text-purple-300" />
                Watch Shorts
              </Link>
            </div>

            {tags.length > 0 ? (
              <div className="mt-7 flex flex-wrap items-center justify-center gap-2">
                {tags.slice(0, 6).map((tag) => (
                  <Link
                    className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3.5 py-1.5 text-xs font-medium text-purple-200 transition hover:border-purple-400/45 hover:text-white"
                    href={`/search?q=%23${tag.tag}`}
                    key={tag.tag}
                  >
                    #{tag.tag}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {/* 4 AI Personas Roster Grid */}
          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300">
                Meet the 4 Live Arena Personas
              </p>
              <span className="text-xs text-white/50">Powered by Local Multi-Model AI</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {ARENA_FIGHTERS.map((fighter) => (
                <Link
                  className={cn(
                    "flex flex-col justify-between rounded-2xl border p-4 transition",
                    fighter.accentClass
                  )}
                  href={`/profile/${fighter.slug}`}
                  key={fighter.slug}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                        <span className={cn("h-2 w-2 rounded-full", fighter.dotClass)} />
                        {fighter.name}
                      </span>
                      <span className="rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-medium text-white/80">
                        {fighter.model}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-white/70">{fighter.role}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5 text-xs">
                    <span className="font-medium text-white/80">{fighter.handle}</span>
                    <span className="text-white/90">View Profile →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Live Arena Debates Preview */}
        {previewPosts.length > 0 ? (
          <section className="relative space-y-4">
            <div className="flex items-center justify-between px-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
                  Live in the Arena
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">
                  Active Drops &amp; AI Crossfire
                </h2>
              </div>
              <Link
                className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/85 transition hover:border-cyan-400/40 hover:text-white"
                href="/home"
              >
                Open Full Feed →
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {previewPosts.map((post) => {
                const replies = post.previewComments ?? [];
                return (
                  <Link
                    className="group panel-soft edge-light flex flex-col justify-between rounded-[30px] border border-white/10 p-5 transition hover:border-purple-400/40"
                    href={`/post/${post.id}`}
                    key={post.id}
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <Avatar
                          className="h-10 w-10 ring-2 ring-white/10"
                          name={post.author.displayName}
                          src={post.author.avatarUrl}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-white">
                            {post.author.displayName}
                          </p>
                          <p className="truncate text-[11px] uppercase tracking-[0.14em] text-white/45">
                            @{post.author.username} · {formatRelativeDate(post.createdAt)}
                          </p>
                        </div>
                      </div>
                      {post.body ? (
                        <p className="mt-4 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-white/90">
                          {post.body}
                        </p>
                      ) : null}

                      {replies.length > 0 ? (
                        <div className="mt-4 space-y-2 rounded-2xl border border-white/[0.08] bg-black/40 p-3">
                          <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-300">
                            <Sparkles className="h-3 w-3" />
                            Arena Replies ({post.commentCount})
                          </p>
                          {replies.slice(0, 2).map((reply) => {
                            const badge = getPersonaBadgeMeta(reply.authorUsername);
                            return (
                              <div
                                className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                                key={reply.id}
                              >
                                <div className="flex flex-wrap items-center gap-1.5">
                                  <span className="text-xs font-semibold text-white">
                                    {reply.authorDisplayName}
                                  </span>
                                  {badge ? (
                                    <span
                                      className={cn(
                                        "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase",
                                        badge.className
                                      )}
                                    >
                                      {badge.label}
                                    </span>
                                  ) : null}
                                </div>
                                <p className="mt-1 line-clamp-2 text-xs text-white/75">
                                  {reply.body}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3 text-xs text-white/60">
                      <span>
                        {post.likeCount} likes · {post.commentCount} replies
                      </span>
                      <span className="font-semibold text-cyan-300 group-hover:text-white">
                        Join debate →
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

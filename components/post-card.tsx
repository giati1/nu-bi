"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bookmark,
  Check,
  Eye,
  Heart,
  Loader2,
  MessageCircle,
  Play,
  Repeat2,
  Send,
  Share2,
  ShieldAlert,
  Sparkles,
  Trash2,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { AdminEngagementControls } from "@/components/admin-engagement-controls";
import { useAuthModal } from "@/components/auth-modal";
import { FeedVideo } from "@/components/feed-video";
import { PostViewTracker } from "@/components/post-view-tracker";
import { QuoteRepostButton } from "@/components/quote-repost-button";
import { getPersonaBadgeMeta } from "@/lib/arena-personas";
import { getProfileHref } from "@/lib/identity";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { FeedPost } from "@/types/domain";

const SUMMON_OPTIONS = [
  { slug: null, label: "🔥 Full Room", single: false },
  { slug: "marcusvance", label: "Marcus Vance", single: true },
  { slug: "elenarostova", label: "Elena Rostova", single: true },
  { slug: "jaxmercer", label: "Jax Mercer", single: true },
  { slug: "sorenvale", label: "Soren Vale", single: true }
] as const;

export function PostCard({
  post,
  viewerId,
  allowDelete = false,
  allowEngagementOverride = false
}: {
  post: FeedPost;
  viewerId: string;
  allowDelete?: boolean;
  allowEngagementOverride?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated, openAuthModal, requireAuthAction } = useAuthModal();
  const [pending, startTransition] = useTransition();
  const [replyPending, startReplyTransition] = useTransition();
  const [viewCount, setViewCount] = useState(post.viewCount);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showSummonBar, setShowSummonBar] = useState(false);
  const [summoningLabel, setSummoningLabel] = useState<string | null>(null);
  const [quickReply, setQuickReply] = useState("");
  const hasMedia = post.media.length > 0;
  const hasVideo = post.media.some((item) => isVideoMedia(item.mimeType, item.url));
  const ViewIcon = hasVideo ? Play : Eye;
  const authorProfileHref = getProfileHref(post.author.username);
  const authorPersonaBadge = getPersonaBadgeMeta(post.author.username);
  const previewComments = post.previewComments ?? [];

  function markMediaFailed(mediaId: string) {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  }

  async function handleSummonPersona(
    personaSlug: "marcusvance" | "elenarostova" | "jaxmercer" | "sorenvale" | null,
    label: string,
    singlePersona: boolean
  ) {
    setSummoningLabel(label);
    setShowSummonBar(false);
    try {
      await fetch("/api/arena/summon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId: post.id,
          personaSlug,
          singlePersona
        })
      });
      window.setTimeout(() => router.refresh(), 3500);
      window.setTimeout(() => router.refresh(), 7500);
      window.setTimeout(() => {
        router.refresh();
        setSummoningLabel(null);
      }, 12500);
    } catch {
      setSummoningLabel(null);
    }
  }

  async function handleSharePost() {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${post.author.displayName} (@${post.author.username}) on NU-BI`,
          text: post.body?.slice(0, 140) || "Check out this debate on NU-BI Arena",
          url: shareUrl
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {}
  }

  return (
    <article className="panel-soft edge-light min-w-0 overflow-hidden rounded-[32px] border border-white/[0.09] p-4 transition duration-200 hover:border-white/[0.16] md:p-6">
      <div className="flex min-w-0 items-start justify-between gap-4">
        {authorProfileHref ? (
          <Link className="flex min-w-0 items-center gap-3.5" href={authorProfileHref}>
            <Avatar
              className="h-12 w-12 ring-2 ring-white/10"
              name={post.author.displayName}
              src={post.author.avatarUrl}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-[15px] font-semibold text-white md:text-base">
                  {post.author.displayName}
                </p>
                {authorPersonaBadge ? (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                      authorPersonaBadge.className
                    )}
                  >
                    <Sparkles className="h-2.5 w-2.5" />
                    {authorPersonaBadge.label}
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 truncate text-xs uppercase tracking-[0.16em] text-white/45 md:text-[11px]">
                @{post.author.username} · {formatRelativeDate(post.createdAt)}
                {post.status && post.status !== "published" ? ` | ${post.status}` : ""}
              </p>
            </div>
          </Link>
        ) : (
          <div className="flex min-w-0 items-center gap-3.5">
            <Avatar
              className="h-12 w-12 ring-2 ring-white/10"
              name={post.author.displayName}
              src={post.author.avatarUrl}
            />
            <div className="min-w-0">
              <p className="truncate text-[15px] font-semibold text-white md:text-base">
                {post.author.displayName}
              </p>
              <p className="mt-0.5 truncate text-xs uppercase tracking-[0.16em] text-white/45 md:text-[11px]">
                @{post.author.username} · {formatRelativeDate(post.createdAt)}
                {post.status && post.status !== "published" ? ` | ${post.status}` : ""}
              </p>
            </div>
          </div>
        )}
        <div className="flex shrink-0 items-center gap-2">
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition",
              showSummonBar || summoningLabel
                ? "border-cyan-400/50 bg-cyan-500/20 text-cyan-200 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                : "border-purple-400/35 bg-purple-500/12 text-purple-200 hover:border-cyan-400/45 hover:bg-cyan-500/15 hover:text-white"
            )}
            disabled={Boolean(summoningLabel)}
            onClick={() => setShowSummonBar((current) => !current)}
            title="Boost this post into the active Pulse wave"
            type="button"
          >
            {summoningLabel ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-300" />
            ) : (
              <Zap className="h-3.5 w-3.5 text-cyan-300" />
            )}
            <span>{summoningLabel ? "Boosting..." : "Boost"}</span>
          </button>
          {Boolean(viewerId) && post.author.id === viewerId ? (
            <Link
              className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 hover:bg-white/5"
              href={`/post/${post.id}/edit`}
            >
              Edit
            </Link>
          ) : null}
          <button
            className="rounded-full border border-white/10 p-2 text-white/55 transition hover:border-white/20 hover:text-white"
            onClick={() =>
              requireAuthAction(() => {
                startTransition(async () => {
                  await fetch("/api/reports", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      targetPostId: post.id,
                      reason: "user_report",
                      details: "Reported from post card"
                    })
                  });
                });
              }, "Sign in to report posts.")
            }
            title="Report post"
            type="button"
          >
            <ShieldAlert className="h-4 w-4" />
          </button>
          {allowDelete ? (
            <button
              className="rounded-full border border-white/10 p-2 text-white/55 transition hover:border-red-400/30 hover:text-red-300"
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
              title="Delete post"
              type="button"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* 1-Click Boost / Ping Voices Drawer */}
      {showSummonBar ? (
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-cyan-400/30 bg-[linear-gradient(135deg,rgba(6,182,212,0.12),rgba(139,92,246,0.12))] p-3">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-200">
            <Zap className="h-3.5 w-3.5 text-cyan-300" />
            Ping into this thread:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {SUMMON_OPTIONS.map((opt) => (
              <button
                className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-xs font-medium text-white/85 transition hover:border-cyan-400/50 hover:bg-cyan-500/20 hover:text-white"
                key={opt.label}
                onClick={() => handleSummonPersona(opt.slug, opt.label, opt.single)}
                type="button"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {summoningLabel ? (
        <div className="mt-3.5 flex items-center gap-2.5 rounded-2xl border border-cyan-400/35 bg-cyan-500/10 px-4 py-2.5 text-xs text-cyan-200">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-300" />
          <span>
            Boosting thread to <strong>{summoningLabel}</strong> — new replies incoming...
          </span>
        </div>
      ) : null}

      {post.repostedPost ? (
        <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent-soft">Repost</p>
          <Link
            className="mt-2 inline-flex text-sm font-medium text-white hover:text-accent-soft"
            href={`/post/${post.repostedPost.id}`}
          >
            @{post.repostedPost.authorUsername} · {post.repostedPost.authorDisplayName}
          </Link>
          {post.repostedPost.body ? (
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-white/68">
              {post.repostedPost.body}
            </p>
          ) : null}
        </div>
      ) : null}

      {post.body ? (
        <div className="mt-4 break-words whitespace-pre-wrap text-[15px] leading-7 text-white/92 md:text-base">
          <RichPostText text={post.body} />
        </div>
      ) : null}
      {post.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link
              className="rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-200 transition hover:border-purple-400/45 hover:text-white"
              href={`/search?q=%23${tag}`}
              key={tag}
            >
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      {post.linkPreview ? (
        <Link
          className="mt-4 block min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/20"
          href={`/post/${post.id}`}
        >
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{post.linkPreview.domain}</p>
          <p className="mt-2 break-words font-medium">{post.linkPreview.title ?? post.linkPreview.url}</p>
          <p className="mt-1 break-words text-sm text-white/60">{post.linkPreview.description}</p>
        </Link>
      ) : null}
      {post.poll ? (
        <div className="mt-4 space-y-2">
          {post.poll.options.map((option) => {
            const percent =
              post.poll && post.poll.totalVotes > 0
                ? Math.round((option.voteCount / post.poll.totalVotes) * 100)
                : 0;
            return (
              <button
                className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left ${
                  option.viewerHasVoted ? "border-accent/50 bg-accent/10" : "border-white/10 bg-white/5"
                }`}
                key={option.id}
                onClick={(event) => {
                  event.preventDefault();
                  requireAuthAction(() => {
                    startTransition(async () => {
                      await fetch("/api/polls/vote", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ optionId: option.id })
                      });
                      router.refresh();
                    });
                  }, "Sign in to vote in polls.");
                }}
                type="button"
              >
                <div className="absolute inset-y-0 left-0 bg-accent/15" style={{ width: `${percent}%` }} />
                <div className="relative flex min-w-0 items-center justify-between gap-3">
                  <span className="break-words">{option.label}</span>
                  <span className="shrink-0 text-xs text-white/55">{option.voteCount} votes</span>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
      {post.media.length > 0 ? (
        <div className="relative mt-5 grid min-w-0 gap-3 sm:gap-4">
          <PostViewTracker
            context={hasVideo ? "feed-video" : "feed-photo"}
            onRecorded={() => setViewCount((current) => current + 1)}
            postId={post.id}
          />
          {post.media.map((item) => {
            const video = isVideoMedia(item.mimeType, item.url);

            if (video) {
              return (
                <div
                  className="relative aspect-square overflow-hidden rounded-[28px] border border-white/[0.08] bg-black lg:aspect-[1/1.08]"
                  key={item.id}
                >
                  <FeedVideo src={item.url} />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />
                  <Link
                    className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/60 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/75"
                    href={`/post/${post.id}`}
                  >
                    Open post
                  </Link>
                </div>
              );
            }

            return (
              <Link
                className="relative block aspect-square overflow-hidden rounded-[28px] border border-white/[0.08] bg-black lg:aspect-[1/1.08]"
                href={`/post/${post.id}`}
                key={item.id}
              >
                {failedMediaIds.includes(item.id) ? (
                  <div className="flex h-full items-center justify-center bg-white/[0.03] px-6 text-center text-xs uppercase tracking-[0.18em] text-white/45">
                    Media unavailable
                  </div>
                ) : (
                  <Image
                    alt="Post media"
                    className="media-image-focus transition duration-500 ease-out hover:scale-[1.015]"
                    fill
                    onError={() => markMediaFailed(item.id)}
                    sizes="720px"
                    src={item.url}
                    unoptimized
                  />
                )}
              </Link>
            );
          })}
        </div>
      ) : null}

      {hasMedia ? (
        <div className="mt-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
          <ViewIcon className="h-3.5 w-3.5" />
          <span>{viewCount} views</span>
        </div>
      ) : null}

      {/* Live Thread Replies + Inline Quick Reply */}
      <div className="mt-5 rounded-[24px] border border-white/[0.08] bg-black/40 p-3.5 md:p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Active Thread ({post.commentCount})
          </span>
          <div className="flex items-center gap-3">
            {previewComments.length === 0 ? (
              <button
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-300 transition hover:text-white"
                disabled={Boolean(summoningLabel)}
                onClick={() => handleSummonPersona(null, "Full Room", false)}
                type="button"
              >
                <Zap className="h-3 w-3" />
                Boost Thread
              </button>
            ) : null}
            <Link
              className="text-xs font-medium text-white/65 transition hover:text-white"
              href={`/post/${post.id}`}
            >
              View full thread →
            </Link>
          </div>
        </div>

        {previewComments.length > 0 ? (
          <div className="space-y-2.5">
            {previewComments.map((comment) => {
              const badge = getPersonaBadgeMeta(comment.authorUsername);
              return (
                <Link
                  className={cn(
                    "block rounded-2xl border border-white/[0.06] bg-white/[0.025] px-3.5 py-2.5 transition hover:border-white/15 hover:bg-white/[0.05]",
                    badge?.cardAccent
                  )}
                  href={`/post/${post.id}`}
                  key={comment.id}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-white">
                      {comment.authorDisplayName}
                    </span>
                    <span className="text-[11px] text-white/45">@{comment.authorUsername}</span>
                    {badge ? (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em]",
                          badge.className
                        )}
                      >
                        {badge.label}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1.5 line-clamp-3 text-xs leading-5 text-white/85">
                    {comment.body}
                  </p>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-white/45">
            Be the first to reply below, or tap <strong>Boost</strong> to push this post into the active room.
          </p>
        )}

        {/* Inline Quick Reply Form right inside the Feed Card */}
        <form
          className="mt-3 flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!isAuthenticated) {
              openAuthModal("Sign in to join the conversation.", `/post/${post.id}`);
              return;
            }
            if (!quickReply.trim()) {
              return;
            }
            startReplyTransition(async () => {
              const response = await fetch("/api/comments", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  postId: post.id,
                  body: quickReply.trim(),
                  media: []
                })
              });
              if (response.ok) {
                setQuickReply("");
                setSummoningLabel("Community");
                router.refresh();
                window.setTimeout(() => router.refresh(), 4000);
                window.setTimeout(() => {
                  router.refresh();
                  setSummoningLabel(null);
                }, 9000);
              }
            });
          }}
        >
          <input
            className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white placeholder-white/40 outline-none transition focus:border-purple-400/50"
            maxLength={400}
            onChange={(event) => setQuickReply(event.target.value)}
            onFocus={() => {
              if (!isAuthenticated) {
                openAuthModal("Sign in to reply to this thread.", `/post/${post.id}`);
              }
            }}
            placeholder="Add a reply or tag @marcusvance / @elenarostova..."
            type="text"
            value={quickReply}
          />
          <button
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-purple-400/35 bg-purple-500/20 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-purple-500/35 disabled:opacity-50"
            disabled={replyPending}
            type="submit"
          >
            <Send className="h-3 w-3" />
            <span>{replyPending ? "..." : "Reply"}</span>
          </button>
        </form>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4 text-sm">
        <ActionButton
          active={post.viewerHasLiked}
          count={post.likeCount}
          disabled={pending}
          icon={<Heart className="h-4 w-4" />}
          label="Like"
          onClick={() =>
            requireAuthAction(() => {
              startTransition(async () => {
                await fetch("/api/likes", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ postId: post.id, viewerId })
                });
                router.refresh();
              });
            }, "Sign in to like posts in the arena.")
          }
        />
        <Link
          className="rounded-full border border-white/10 bg-white/[0.02] px-4 py-2 text-white/75 transition hover:border-cyan-400/35 hover:bg-cyan-500/10 hover:text-white"
          href={`/post/${post.id}`}
        >
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            <span>{post.commentCount}</span>
            <span className="hidden text-xs text-white/60 sm:inline">Debate</span>
          </span>
        </Link>
        <button
          className={cn(
            "rounded-full border px-4 py-2 transition",
            post.viewerHasSaved
              ? "border-accent bg-accent/15 text-accent-soft"
              : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/5 hover:text-white"
          )}
          disabled={pending}
          onClick={() =>
            requireAuthAction(() => {
              startTransition(async () => {
                await fetch("/api/saved", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ postId: post.id })
                });
                router.refresh();
              });
            }, "Sign in to bookmark posts.")
          }
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            <span className="hidden sm:inline">Save</span>
          </span>
        </button>
        <button
          className={cn(
            "rounded-full border px-4 py-2 transition",
            post.viewerHasReposted
              ? "border-accent bg-accent/15 text-accent-soft"
              : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/5 hover:text-white"
          )}
          disabled={pending}
          onClick={() =>
            requireAuthAction(() => {
              startTransition(async () => {
                await fetch("/api/reposts", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ postId: post.id })
                });
                router.refresh();
              });
            }, "Sign in to repost to your feed.")
          }
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Repeat2 className="h-4 w-4" />
            {post.repostCount}
          </span>
        </button>
        <QuoteRepostButton
          authorDisplayName={post.author.displayName}
          authorUsername={post.author.username}
          postId={post.id}
          repostedBody={post.body}
        />
        <button
          className={cn(
            "ml-auto rounded-full border px-3.5 py-2 text-xs font-medium transition",
            copiedLink
              ? "border-emerald-400/45 bg-emerald-500/15 text-emerald-300"
              : "border-white/10 bg-white/[0.02] text-white/75 hover:border-white/25 hover:bg-white/5 hover:text-white"
          )}
          onClick={handleSharePost}
          type="button"
        >
          <span className="inline-flex items-center gap-1.5">
            {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
            <span>{copiedLink ? "Copied!" : "Share"}</span>
          </span>
        </button>
      </div>
      {allowEngagementOverride ? (
        <AdminEngagementControls
          className="mt-5"
          entityId={post.id}
          initialLikeCount={post.likeCount}
          initialViewCount={post.viewCount}
          mode="post"
        />
      ) : null}
    </article>
  );
}

function RichPostText({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/[^\s]+|@[a-z0-9_]{3,24}|#[a-z0-9_]{2,40})/gi);

  return (
    <>
      {parts.map((part, index) => {
        if (!part) {
          return null;
        }
        if (/^@[a-z0-9_]{3,24}$/i.test(part)) {
          const username = part.slice(1);
          const profileHref = getProfileHref(username);
          if (!profileHref) {
            return <span key={`${part}-${index}`}>{part}</span>;
          }
          return (
            <Link className="font-medium text-cyan-300 hover:text-white" href={profileHref} key={`${part}-${index}`}>
              {part}
            </Link>
          );
        }
        if (/^#[a-z0-9_]{2,40}$/i.test(part)) {
          return (
            <Link className="font-medium text-purple-300 hover:text-white" href={`/search?q=${encodeURIComponent(part)}`} key={`${part}-${index}`}>
              {part}
            </Link>
          );
        }
        if (/^https?:\/\/[^\s]+$/i.test(part)) {
          return (
            <a className="font-medium text-cyan-300 hover:text-white" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
              {part}
            </a>
          );
        }
        return <span key={`${part}-${index}`}>{part}</span>;
      })}
    </>
  );
}

function isVideoMedia(mimeType: string | null, url: string) {
  return Boolean(mimeType?.startsWith("video/") || url.match(/\.(mp4|webm|mov)(\?|$)/i));
}

function ActionButton({
  active,
  count,
  icon,
  label,
  onClick,
  disabled
}: {
  active?: boolean;
  count: number;
  icon: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={cn(
        "rounded-full border px-4 py-2 transition",
        active
          ? "border-accent bg-accent/15 text-accent-soft"
          : "border-white/10 bg-white/[0.02] text-white/75 hover:bg-white/5 hover:text-white"
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        <span className="sr-only">{label}</span>
        {count}
      </span>
    </button>
  );
}

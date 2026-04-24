"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Eye, Heart, MessageCircle, Play, Repeat2, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { AdminEngagementControls } from "@/components/admin-engagement-controls";
import { FeedVideo } from "@/components/feed-video";
import { PostViewTracker } from "@/components/post-view-tracker";
import { QuoteRepostButton } from "@/components/quote-repost-button";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { FeedPost } from "@/types/domain";

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
  const [pending, startTransition] = useTransition();
  const [viewCount, setViewCount] = useState(post.viewCount);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const hasMedia = post.media.length > 0;
  const hasVideo = post.media.some((item) => isVideoMedia(item.mimeType, item.url));
  const ViewIcon = hasVideo ? Play : Eye;

  function markMediaFailed(mediaId: string) {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  }

  return (
    <article className="panel-soft edge-light min-w-0 overflow-hidden rounded-[34px] border border-white/[0.08] p-4 md:p-5">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <Link className="flex min-w-0 items-center gap-3" href={`/profile/${post.author.username}`}>
          <Avatar
            className="h-12 w-12"
            name={post.author.displayName}
            src={post.author.avatarUrl}
          />
          <div className="min-w-0">
            <p className="truncate text-[15px] font-semibold text-white md:text-base">{post.author.displayName}</p>
            <p className="truncate text-xs uppercase tracking-[0.16em] text-white/42 md:text-[11px]">
              @{post.author.username} / {formatRelativeDate(post.createdAt)}
              {post.status && post.status !== "published" ? ` | ${post.status}` : ""}
            </p>
          </div>
        </Link>
        <div className="flex shrink-0 gap-2">
          {post.author.id === viewerId ? (
            <Link
              className="rounded-full border border-white/10 px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] text-white/70 hover:bg-white/5"
              href={`/post/${post.id}/edit`}
            >
              Edit
            </Link>
          ) : null}
          <button
            className="rounded-full border border-white/10 p-2 text-white/60 hover:text-white"
            onClick={() =>
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
              })
            }
            type="button"
          >
            <ShieldAlert className="h-4 w-4" />
          </button>
          {allowDelete ? (
            <button
              className="rounded-full border border-white/10 p-2 text-white/60 hover:text-red-300"
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
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {post.repostedPost ? (
        <div className="mt-5 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[11px] uppercase tracking-[0.16em] text-accent-soft">Repost</p>
          <Link className="mt-2 inline-flex text-sm font-medium text-white hover:text-accent-soft" href={`/post/${post.repostedPost.id}`}>
            @{post.repostedPost.authorUsername} · {post.repostedPost.authorDisplayName}
          </Link>
          {post.repostedPost.body ? (
            <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm text-white/68">{post.repostedPost.body}</p>
          ) : null}
        </div>
      ) : null}

      {post.body ? (
        <div className="mt-5 break-words whitespace-pre-wrap text-[15px] leading-7 text-white/90 md:text-[15px]">
          <RichPostText text={post.body} />
        </div>
      ) : null}
      {post.tags.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <Link className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-accent-soft" href={`/search?q=%23${tag}`} key={tag}>
              #{tag}
            </Link>
          ))}
        </div>
      ) : null}
      {post.linkPreview ? (
        <Link className="mt-5 block min-w-0 rounded-[24px] border border-white/10 bg-white/[0.03] p-4" href={`/post/${post.id}`}>
          <p className="text-xs uppercase tracking-[0.18em] text-white/45">{post.linkPreview.domain}</p>
          <p className="mt-2 break-words font-medium">{post.linkPreview.title ?? post.linkPreview.url}</p>
          <p className="mt-1 break-words text-sm text-white/60">{post.linkPreview.description}</p>
        </Link>
      ) : null}
      {post.poll ? (
        <div className="mt-4 space-y-2">
            {post.poll.options.map((option) => {
              const percent = post.poll && post.poll.totalVotes > 0 ? Math.round((option.voteCount / post.poll.totalVotes) * 100) : 0;
              return (
                <button
                  className={`relative w-full overflow-hidden rounded-2xl border px-4 py-3 text-left ${
                    option.viewerHasVoted ? "border-accent/50 bg-accent/10" : "border-white/10 bg-white/5"
                  }`}
                  key={option.id}
                  onClick={(event) => {
                    event.preventDefault();
                    startTransition(async () => {
                      await fetch("/api/polls/vote", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ optionId: option.id })
                      });
                      router.refresh();
                    });
                  }}
                  type="button"
                >
                  <div className="absolute inset-y-0 left-0 bg-accent/10" style={{ width: `${percent}%` }} />
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
                  className="relative aspect-square overflow-hidden rounded-[30px] border border-white/[0.08] bg-black lg:aspect-[1/1.08]"
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
                className="relative block aspect-square overflow-hidden rounded-[30px] border border-white/[0.08] bg-black lg:aspect-[1/1.08]"
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

      <div className="mt-6 flex flex-wrap items-center gap-2.5 border-t border-white/[0.08] pt-4 text-sm">
        <ActionButton
          active={post.viewerHasLiked}
          count={post.likeCount}
          disabled={pending}
          icon={<Heart className="h-4 w-4" />}
          label="Like"
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/likes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id, viewerId })
              });
              router.refresh();
            })
          }
        />
        <Link
          className="rounded-full border border-white/10 px-4 py-2 text-white/70 hover:bg-white/5"
          href={`/post/${post.id}`}
        >
          <span className="inline-flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            {post.commentCount}
          </span>
        </Link>
        <button
          className={cn(
            "rounded-full border px-4 py-2",
            post.viewerHasSaved ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/70 hover:bg-white/5"
          )}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/saved", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id })
              });
              router.refresh();
            })
          }
          type="button"
        >
          <span className="inline-flex items-center gap-2">
            <Bookmark className="h-4 w-4" />
            Save
          </span>
        </button>
        <button
          className={cn(
            "rounded-full border px-4 py-2",
            post.viewerHasReposted ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/70 hover:bg-white/5"
          )}
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/reposts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId: post.id })
              });
              router.refresh();
            })
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
          return (
            <Link className="font-medium text-accent-soft hover:text-white" href={`/profile/${username}`} key={`${part}-${index}`}>
              {part}
            </Link>
          );
        }
        if (/^#[a-z0-9_]{2,40}$/i.test(part)) {
          return (
            <Link className="font-medium text-accent-soft hover:text-white" href={`/search?q=${encodeURIComponent(part)}`} key={`${part}-${index}`}>
              {part}
            </Link>
          );
        }
        if (/^https?:\/\/[^\s]+$/i.test(part)) {
          return (
            <a className="font-medium text-accent-soft hover:text-white" href={part} key={`${part}-${index}`} rel="noreferrer" target="_blank">
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
        "rounded-full border px-4 py-2",
        active ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/70 hover:bg-white/5"
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

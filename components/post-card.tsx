"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Bookmark, Heart, MessageCircle, Play, Repeat2, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Avatar } from "@/components/avatar";
import { FeedVideo } from "@/components/feed-video";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { FeedPost } from "@/types/domain";

export function PostCard({
  post,
  viewerId,
  allowDelete = false
}: {
  post: FeedPost;
  viewerId: string;
  allowDelete?: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <article className="glass-panel min-w-0 overflow-hidden rounded-[30px] p-4 shadow-panel md:p-5">
      <div className="flex min-w-0 items-start justify-between gap-4">
        <Link className="flex min-w-0 items-center gap-3" href={`/profile/${post.author.username}`}>
          <Avatar
            className="h-12 w-12"
            name={post.author.displayName}
            src={post.author.avatarUrl}
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">{post.author.displayName}</p>
            <p className="truncate text-sm text-white/50">
              @{post.author.username} | {formatRelativeDate(post.createdAt)}
              {post.status && post.status !== "published" ? ` | ${post.status}` : ""}
            </p>
          </div>
        </Link>
        <div className="flex shrink-0 gap-2">
          {post.author.id === viewerId ? (
            <Link
              className="rounded-full border border-white/10 px-3 py-2 text-xs text-white/70 hover:bg-white/5"
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

      <Link href={`/post/${post.id}`}>
        <p className="mt-4 break-words whitespace-pre-wrap text-[15px] leading-7 text-white/92">{post.body}</p>
        {post.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-accent-soft" key={tag}>
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
        {post.linkPreview ? (
          <div className="mt-4 min-w-0 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-white/45">{post.linkPreview.domain}</p>
            <p className="mt-2 break-words font-medium">{post.linkPreview.title ?? post.linkPreview.url}</p>
            <p className="mt-1 break-words text-sm text-white/60">{post.linkPreview.description}</p>
          </div>
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
          <div className="mt-4 grid min-w-0 gap-3">
            {post.media.map((item) => (
              <div className="relative aspect-[4/3] overflow-hidden rounded-[24px]" key={item.id}>
                {isVideoMedia(item.mimeType, item.url) ? (
                  <FeedVideo src={item.url} />
                ) : (
                  <Image alt="Post media" className="object-cover" fill sizes="720px" src={item.url} unoptimized />
                )}
              </div>
            ))}
          </div>
        ) : null}
      </Link>

      {post.media.some((item) => isVideoMedia(item.mimeType, item.url)) ? (
        <div className="mt-4 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-white/45">
          <Play className="h-3.5 w-3.5" />
          <span>{post.viewCount} views</span>
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3 text-sm">
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
          className="rounded-full border border-white/10 px-4 py-2 text-white/70 hover:bg-white/5"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/posts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  body: `Reposted from @${post.author.username}`,
                  repostOfPostId: post.id
                })
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
      </div>
    </article>
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

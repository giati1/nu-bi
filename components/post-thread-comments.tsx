"use client";

import Link from "next/link";
import { CornerDownRight, MessageCircle, Sparkles, Swords } from "lucide-react";
import { useState } from "react";
import { useAuthModal } from "@/components/auth-modal";
import { Avatar } from "@/components/avatar";
import { CommentComposer, type ReplyTarget } from "@/components/comment-composer";
import { getPersonaBadgeMeta } from "@/lib/arena-personas";
import { getProfileHref } from "@/lib/identity";
import { cn, formatRelativeDate } from "@/lib/utils";
import type { CommentRecord } from "@/types/domain";

export function PostThreadComments({
  postId,
  comments
}: {
  postId: string;
  comments: CommentRecord[];
}) {
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const [replyingTo, setReplyingTo] = useState<ReplyTarget | null>(null);

  const aiCommentCount = comments.filter((c) =>
    c.author.username.toLowerCase().startsWith("nova_")
  ).length;
  const humanCommentCount = comments.length - aiCommentCount;

  return (
    <div className="space-y-4">
      <CommentComposer
        onCancelReply={() => setReplyingTo(null)}
        postId={postId}
        replyingTo={replyingTo}
      />

      {/* Arena Debate Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
        <div className="flex items-center gap-2">
          <Swords className="h-4 w-4 text-cyan-300" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
            Arena Debate Thread ({comments.length})
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs text-white/60">
          <span className="inline-flex items-center gap-1 text-purple-300">
            <Sparkles className="h-3 w-3" />
            {aiCommentCount} AI Persona {aiCommentCount === 1 ? "Take" : "Takes"}
          </span>
          <span>·</span>
          <span>
            {humanCommentCount} Human {humanCommentCount === 1 ? "Take" : "Takes"}
          </span>
        </div>
      </div>

      <section className="space-y-3.5">
        {comments.map((comment) => {
          const personaBadge = getPersonaBadgeMeta(comment.author.username);
          const profileHref = getProfileHref(comment.author.username);

          return (
            <article
              className={cn(
                "glass-panel rounded-[26px] border border-white/[0.09] p-5 transition hover:border-white/[0.16]",
                personaBadge?.cardAccent
              )}
              key={comment.id}
              style={{ marginLeft: `${Math.min(comment.depth, 3) * 20}px` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {profileHref ? (
                    <Link href={profileHref}>
                      <Avatar
                        className="h-11 w-11 ring-2 ring-white/10"
                        name={comment.author.displayName}
                        src={comment.author.avatarUrl}
                      />
                    </Link>
                  ) : (
                    <Avatar
                      className="h-11 w-11 ring-2 ring-white/10"
                      name={comment.author.displayName}
                      src={comment.author.avatarUrl}
                    />
                  )}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {profileHref ? (
                        <Link
                          className="font-semibold text-white hover:text-cyan-300"
                          href={profileHref}
                        >
                          {comment.author.displayName}
                        </Link>
                      ) : (
                        <p className="font-semibold text-white">{comment.author.displayName}</p>
                      )}
                      {personaBadge ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
                            personaBadge.className
                          )}
                        >
                          <Sparkles className="h-2.5 w-2.5" />
                          {personaBadge.label}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-white/45">
                      @{comment.author.username} · {formatRelativeDate(comment.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:border-cyan-400/40 hover:bg-cyan-500/15 hover:text-white"
                  onClick={() => {
                    if (!isAuthenticated) {
                      openAuthModal(
                        `Sign in to reply to ${comment.author.displayName}.`,
                        `/post/${postId}`
                      );
                      return;
                    }
                    setReplyingTo({
                      id: comment.id,
                      username: comment.author.username,
                      displayName: comment.author.displayName
                    });
                  }}
                  type="button"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Reply
                </button>
              </div>
              {comment.depth > 0 ? (
                <p className="mt-2.5 inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-cyan-300/75">
                  <CornerDownRight className="h-3 w-3" />
                  Counter-Reply
                </p>
              ) : null}
              {comment.body ? (
                <p className="mt-3.5 whitespace-pre-wrap text-[15px] leading-6 text-white/90">
                  {comment.body}
                </p>
              ) : null}
              {comment.media.length > 0 ? (
                <div className="mt-4 space-y-3">
                  {comment.media.map((media) => (
                    <div
                      className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4"
                      key={media.id}
                    >
                      <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-white/45">
                        {media.mimeType?.startsWith("audio/") ? "Voice comment" : "Attachment"}
                      </p>
                      {media.mimeType?.startsWith("audio/") ? (
                        <audio className="w-full" controls preload="metadata" src={media.url} />
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </div>
  );
}

"use client";

import { MessageCircle } from "lucide-react";
import { useState } from "react";
import { useAuthModal } from "@/components/auth-modal";
import { Avatar } from "@/components/avatar";
import { CommentComposer, type ReplyTarget } from "@/components/comment-composer";
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

  return (
    <>
      <CommentComposer
        onCancelReply={() => setReplyingTo(null)}
        postId={postId}
        replyingTo={replyingTo}
      />
      <section className="space-y-4">
        {comments.map((comment) => {
          const isNovaPersona = comment.author.username.toLowerCase().startsWith("nova_");
          return (
            <article
              className="glass-panel rounded-[28px] p-5"
              key={comment.id}
              style={{ marginLeft: `${comment.depth * 18}px` }}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    className="h-11 w-11"
                    name={comment.author.displayName}
                    src={comment.author.avatarUrl}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{comment.author.displayName}</p>
                      {isNovaPersona ? (
                        <span className="rounded-full border border-accent/35 bg-accent/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-soft">
                          AI Persona
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-white/50">@{comment.author.username}</p>
                  </div>
                </div>
                <button
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 transition hover:border-accent/40 hover:bg-accent/10 hover:text-white"
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
                <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/40">
                  Reply
                </p>
              ) : null}
              {comment.body ? (
                <p className="mt-4 whitespace-pre-wrap text-white/80">{comment.body}</p>
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
    </>
  );
}

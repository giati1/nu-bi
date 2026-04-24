"use client";

import Image from "next/image";
import { Reply } from "lucide-react";
import { useState } from "react";
import { MessageReactions } from "@/components/message-reactions";
import { MessageComposer } from "@/components/message-composer";
import { formatRelativeDate } from "@/lib/utils";
import type { MessageRecord } from "@/types/domain";

export function ConversationThread({
  conversationId,
  viewerId,
  thread,
  readState
}: {
  conversationId: string;
  viewerId: string;
  thread: MessageRecord[];
  readState: {
    counterpartDisplayName: string;
    counterpartLastReadMessageAt: string | null;
  } | null;
}) {
  const [replyTo, setReplyTo] = useState<MessageRecord | null>(null);
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);

  function markMediaFailed(mediaId: string) {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  }

  return (
    <>
      <section className="panel-soft edge-light rounded-[34px] bg-black p-5">
        <div className="space-y-4">
          {thread.map((message, index) => {
            const mine = message.senderId === viewerId;
            const previous = thread[index - 1] ?? null;
            const startsNewDay =
              !previous ||
              new Date(previous.createdAt).toDateString() !== new Date(message.createdAt).toDateString();
            const seenByCounterpart = Boolean(
              mine &&
                readState?.counterpartLastReadMessageAt &&
                new Date(message.createdAt).getTime() <=
                  new Date(readState.counterpartLastReadMessageAt).getTime()
            );
            const isLastOutgoing =
              mine &&
              thread
                .filter((item) => item.senderId === viewerId)
                .at(-1)?.id === message.id;

            return (
              <div key={message.id}>
                {startsNewDay ? (
                  <div className="flex justify-center pb-2 pt-1">
                    <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      {new Date(message.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric"
                      })}
                    </span>
                  </div>
                ) : null}
                <div
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-[26px] border bg-white/[0.02] px-3 py-3 ${
                      mine ? "border-accent/70" : "border-white/14"
                    }`}
                  >
                    {!mine ? <p className="mb-2 text-xs uppercase tracking-[0.14em] text-white/45">{message.sender.displayName}</p> : null}
                    {message.replyTo ? (
                      <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/75">
                        <p className="font-medium">{message.replyTo.senderDisplayName}</p>
                        <p className="mt-1 truncate">{message.replyTo.body || "Attachment"}</p>
                      </div>
                    ) : null}
                    {message.body ? <p className="whitespace-pre-wrap px-3 text-sm leading-7 text-white">{message.body}</p> : null}
                    {message.media.length > 0 ? (
                      <div className="mt-3 grid gap-3 px-3">
                        {message.media.map((media) => (
                          <div className="relative overflow-hidden rounded-[20px]" key={media.id}>
                            <div className="mb-2 inline-flex rounded-full border border-accent/20 bg-white/[0.03] px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] text-white/68">
                              {media.mimeType?.startsWith("audio/")
                                ? "Voice note"
                                : media.mimeType?.startsWith("video/")
                                  ? "Video attachment"
                                  : "Photo attachment"}
                            </div>
                            {media.mimeType?.startsWith("video/") ? (
                              <video className="max-h-72 w-full rounded-[20px] bg-black object-cover" controls playsInline preload="metadata" src={media.url} />
                            ) : media.mimeType?.startsWith("audio/") ? (
                              <audio className="w-full" controls preload="metadata" src={media.url} />
                            ) : failedMediaIds.includes(media.id) ? (
                              <div className="flex aspect-[4/3] items-center justify-center rounded-[20px] bg-white/[0.03] px-4 text-center text-[11px] uppercase tracking-[0.16em] text-white/45">
                                Media unavailable
                              </div>
                            ) : (
                              <div className="relative aspect-[4/3]">
                                <Image
                                  alt="Message attachment"
                                  className="object-cover"
                                  fill
                                  onError={() => markMediaFailed(media.id)}
                                  sizes="420px"
                                  src={media.url}
                                  unoptimized
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : null}
                    <div className="px-3">
                      <MessageReactions messageId={message.id} reactions={message.reactions} />
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3 px-3 text-[11px] uppercase tracking-[0.12em] text-white/46">
                      <p>{formatRelativeDate(message.createdAt)}</p>
                      <div className="flex items-center gap-3">
                        <button
                          className="inline-flex items-center gap-1 text-white/62 transition hover:text-white"
                          onClick={() => setReplyTo(message)}
                          type="button"
                        >
                          <Reply className="h-3.5 w-3.5" />
                          Reply
                        </button>
                        {mine && isLastOutgoing ? <p>{seenByCounterpart ? "Seen" : "Delivered"}</p> : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {readState?.counterpartLastReadMessageAt ? (
          <p className="mt-5 text-right text-xs text-white/45">
            {readState.counterpartDisplayName} viewed this thread {formatRelativeDate(readState.counterpartLastReadMessageAt)}.
          </p>
        ) : null}
      </section>
      <MessageComposer
        conversationId={conversationId}
        onClearReply={() => setReplyTo(null)}
        replyTo={
          replyTo
            ? {
                id: replyTo.id,
                body: replyTo.body,
                senderDisplayName: replyTo.sender.displayName
              }
            : null
        }
      />
    </>
  );
}

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

  return (
    <>
      <section className="glass-panel rounded-[32px] p-5 shadow-panel">
        <div className="space-y-4">
          {thread.map((message) => {
            const mine = message.senderId === viewerId;
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
              <div
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
                key={message.id}
              >
                <div
                  className={`max-w-[80%] rounded-[24px] px-4 py-3 ${
                    mine ? "bg-accent text-white" : "bg-white/6 text-white"
                  }`}
                >
                  {!mine ? <p className="mb-1 text-xs text-white/55">{message.sender.displayName}</p> : null}
                  {message.replyTo ? (
                    <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/75">
                      <p className="font-medium">{message.replyTo.senderDisplayName}</p>
                      <p className="mt-1 truncate">{message.replyTo.body || "Attachment"}</p>
                    </div>
                  ) : null}
                  {message.body ? <p className="whitespace-pre-wrap text-sm">{message.body}</p> : null}
                  {message.media.length > 0 ? (
                    <div className="mt-3 grid gap-3">
                      {message.media.map((media) => (
                        <div className="relative overflow-hidden rounded-[20px]" key={media.id}>
                          {media.mimeType?.startsWith("video/") ? (
                            <video className="max-h-72 w-full rounded-[20px] bg-black object-cover" controls playsInline preload="metadata" src={media.url} />
                          ) : media.mimeType?.startsWith("audio/") ? (
                            <audio className="w-full" controls preload="metadata" src={media.url} />
                          ) : (
                            <div className="relative aspect-[4/3]">
                              <Image alt="Message attachment" className="object-cover" fill sizes="420px" src={media.url} unoptimized />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : null}
                  <MessageReactions messageId={message.id} reactions={message.reactions} />
                  <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-white/50">
                    <p>{formatRelativeDate(message.createdAt)}</p>
                    <div className="flex items-center gap-3">
                      <button
                        className="inline-flex items-center gap-1 text-white/70"
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

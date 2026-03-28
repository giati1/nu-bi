"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

const emojis = ["🔥", "❤️", "😂", "👀"];

export function MessageReactions({
  messageId,
  reactions
}: {
  messageId: string;
  reactions: Array<{ emoji: string; count: number; viewerReacted: boolean }>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {reactions.map((reaction) => (
        <button
          className={`rounded-full px-2 py-1 text-xs ${reaction.viewerReacted ? "bg-accent/20 text-white" : "bg-white/10 text-white/70"}`}
          disabled={pending}
          key={reaction.emoji}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/messages/reactions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ messageId, emoji: reaction.emoji })
              });
              router.refresh();
            })
          }
          type="button"
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}
      {emojis
        .filter((emoji) => !reactions.some((reaction) => reaction.emoji === emoji))
        .map((emoji) => (
          <button
            className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/70"
            disabled={pending}
            key={emoji}
            onClick={() =>
              startTransition(async () => {
                await fetch("/api/messages/reactions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ messageId, emoji })
                });
                router.refresh();
              })
            }
            type="button"
          >
            {emoji}
          </button>
        ))}
    </div>
  );
}

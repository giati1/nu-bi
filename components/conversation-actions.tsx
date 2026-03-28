"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function ConversationActions({
  conversationId,
  targetUserId,
  isPinned,
  isArchived,
  isMuted
}: {
  conversationId: string;
  targetUserId: string;
  isPinned: boolean;
  isArchived: boolean;
  isMuted: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        className="rounded-2xl border border-white/10 px-4 py-2 text-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId, isPinned: !isPinned })
            });
            router.refresh();
          })
        }
        type="button"
      >
        {isPinned ? "Unpin" : "Pin"}
      </button>
      <button
        className="rounded-2xl border border-white/10 px-4 py-2 text-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId, isArchived: !isArchived })
            });
            router.refresh();
          })
        }
        type="button"
      >
        {isArchived ? "Unarchive" : "Archive"}
      </button>
      <button
        className="rounded-2xl border border-white/10 px-4 py-2 text-sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId, isMuted: !isMuted })
            });
            router.refresh();
          })
        }
        type="button"
      >
        {isMuted ? "Unmute" : "Mute"}
      </button>
      <button
        className="rounded-2xl border border-red-500/20 px-4 py-2 text-sm text-red-200"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/blocks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetUserId })
            });
            router.push("/messages");
            router.refresh();
          })
        }
        type="button"
      >
        Block user
      </button>
    </div>
  );
}

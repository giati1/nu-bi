"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RelationshipActions({ targetUserId }: { targetUserId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex gap-2">
      <button
        className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/mutes", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetUserId })
            });
            router.refresh();
          })
        }
        type="button"
      >
        Mute
      </button>
      <button
        className="rounded-2xl border border-red-500/40 px-4 py-3 text-sm text-red-300"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/blocks", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetUserId })
            });
            router.refresh();
          })
        }
        type="button"
      >
        Block
      </button>
    </div>
  );
}

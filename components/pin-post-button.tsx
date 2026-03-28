"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function PinPostButton({
  postId,
  pinned
}: {
  postId: string;
  pinned: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/70"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/profile/pin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId: pinned ? null : postId })
          });
          router.refresh();
        })
      }
      type="button"
    >
      {pending ? "Updating..." : pinned ? "Unpin post" : "Pin on profile"}
    </button>
  );
}

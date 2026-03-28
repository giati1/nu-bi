"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function FollowButton({
  userId,
  initialFollowing
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await fetch("/api/follow", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ targetUserId: userId })
          });
          router.refresh();
        })
      }
      type="button"
    >
      {pending ? "Updating..." : initialFollowing ? "Following" : "Follow"}
    </button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useAuthModal } from "@/components/auth-modal";

export function FollowButton({
  userId,
  initialFollowing
}: {
  userId: string;
  initialFollowing: boolean;
}) {
  const router = useRouter();
  const { requireAuthAction } = useAuthModal();
  const [pending, startTransition] = useTransition();

  return (
    <button
      className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white disabled:opacity-60"
      disabled={pending}
      onClick={() =>
        requireAuthAction(() => {
          startTransition(async () => {
            await fetch("/api/follow", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ targetUserId: userId })
            });
            router.refresh();
          });
        }, "Sign in to follow creators and AI personas.")
      }
      type="button"
    >
      {pending ? "Updating..." : initialFollowing ? "Following" : "Follow"}
    </button>
  );
}

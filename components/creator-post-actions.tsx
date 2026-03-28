"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CreatorPostActions({
  postId,
  status
}: {
  postId: string;
  status: "published" | "draft" | "scheduled";
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {status !== "published" ? (
        <button
          className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-black"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/posts/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, status: "published" })
              });
              router.refresh();
            })
          }
          type="button"
        >
          Publish now
        </button>
      ) : null}
      {status === "scheduled" ? (
        <button
          className="rounded-2xl border border-white/10 px-4 py-2 text-sm text-white/70"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await fetch("/api/posts/status", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ postId, status: "draft" })
              });
              router.refresh();
            })
          }
          type="button"
        >
          Move to draft
        </button>
      ) : null}
      <button
        className="rounded-2xl border border-red-500/30 px-4 py-2 text-sm text-red-300"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await fetch("/api/posts", {
              method: "DELETE",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ postId })
            });
            router.refresh();
          })
        }
        type="button"
      >
        Delete
      </button>
    </div>
  );
}

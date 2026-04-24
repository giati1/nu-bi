"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Mode = "post" | "profile";

export function AdminEngagementControls({
  mode,
  entityId,
  initialLikeCount,
  initialViewCount,
  className = ""
}: {
  mode: Mode;
  entityId: string;
  initialLikeCount: number;
  initialViewCount: number;
  className?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [likeCount, setLikeCount] = useState(String(initialLikeCount));
  const [viewCount, setViewCount] = useState(String(initialViewCount));
  const [error, setError] = useState<string | null>(null);

  const title = mode === "post" ? "Admin post numbers" : "Admin profile numbers";
  const endpoint =
    mode === "post" ? "/api/admin/engagement/post" : "/api/admin/engagement/profile";
  const idKey = mode === "post" ? "postId" : "userId";

  return (
    <section className={`rounded-[24px] border border-accent/25 bg-accent/8 p-4 ${className}`.trim()}>
      <p className="text-[11px] uppercase tracking-[0.2em] text-accent-soft">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/55">Likes</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
            inputMode="numeric"
            min="0"
            onChange={(event) => setLikeCount(event.target.value)}
            type="number"
            value={likeCount}
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[11px] uppercase tracking-[0.18em] text-white/55">Views</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-accent"
            inputMode="numeric"
            min="0"
            onChange={(event) => setViewCount(event.target.value)}
            type="number"
            value={viewCount}
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-white/90 disabled:opacity-60"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const response = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  [idKey]: entityId,
                  likeCount: Number(likeCount),
                  viewCount: Number(viewCount)
                })
              });

              const payload = (await response.json()) as { error?: string };
              if (!response.ok) {
                setError(payload.error ?? "Update failed.");
                return;
              }

              router.refresh();
            })
          }
          type="button"
        >
          {pending ? "Saving..." : "Save numbers"}
        </button>
        <p className="text-xs text-white/55">Internal admin only. This overrides the displayed counts.</p>
      </div>
    </section>
  );
}

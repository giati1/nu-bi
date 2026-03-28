"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function PostEditor({
  post
}: {
  post: {
    id: string;
    body: string;
    status: "published" | "draft" | "scheduled";
    scheduledFor: string | null | undefined;
  };
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState(post.body);
  const [status, setStatus] = useState<"published" | "draft" | "scheduled">(post.status);
  const [scheduledFor, setScheduledFor] = useState(post.scheduledFor ? post.scheduledFor.slice(0, 16) : "");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="glass-panel rounded-[30px] p-5 shadow-panel"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        startTransition(async () => {
          const response = await fetch(`/api/posts/${post.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              body,
              status,
              scheduledFor: status === "scheduled" ? scheduledFor : null
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Failed to update post.");
            return;
          }
          router.push(`/post/${post.id}`);
          router.refresh();
        });
      }}
    >
      <div className="flex flex-wrap gap-2">
        {[
          ["published", "Publish"],
          ["draft", "Draft"],
          ["scheduled", "Schedule"]
        ].map(([value, label]) => (
          <button
            className={`rounded-full px-3 py-2 text-xs uppercase tracking-[0.14em] ${
              status === value ? "bg-white text-black" : "bg-white/10 text-white/70"
            }`}
            key={value}
            onClick={() => setStatus(value as "published" | "draft" | "scheduled")}
            type="button"
          >
            {label}
          </button>
        ))}
      </div>
      <textarea
        className="mt-4 min-h-40 w-full rounded-[24px] border border-white/10 bg-black/40 px-4 py-4 outline-none transition focus:border-accent"
        maxLength={500}
        onChange={(event) => setBody(event.target.value)}
        value={body}
      />
      {status === "scheduled" ? (
        <input
          className="mt-4 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setScheduledFor(event.target.value)}
          type="datetime-local"
          value={scheduledFor}
        />
      ) : null}
      {error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
        <button
          className="rounded-2xl border border-white/10 px-5 py-3 text-sm text-white/70"
          onClick={() => router.back()}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

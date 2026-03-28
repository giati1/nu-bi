"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function CommentComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();

  return (
    <form
      className="glass-panel rounded-[28px] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!body.trim()) {
          return;
        }

        startTransition(async () => {
          await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, body })
          });
          setBody("");
          router.refresh();
        });
      }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">Join the conversation with something specific.</p>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/5"
          disabled={aiPending}
          onClick={() =>
            startAITransition(async () => {
              const response = await fetch("/api/ai/reply", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ body, intent: "supportive" })
              });
              const payload = await response.json();
              if (response.ok) {
                setBody(payload.reply);
              }
            })
          }
          type="button"
        >
          <Sparkles className="h-3.5 w-3.5 text-accent-soft" />
          {aiPending ? "Thinking..." : "AI reply"}
        </button>
      </div>
      <div className="flex gap-3">
        <textarea
          className="min-h-24 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a comment..."
          value={body}
        />
        <button
          className="h-fit rounded-2xl bg-accent px-5 py-3 font-medium text-white disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          Reply
        </button>
      </div>
    </form>
  );
}

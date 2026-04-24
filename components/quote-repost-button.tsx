"use client";

import { Repeat2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type QuoteRepostButtonProps = {
  postId: string;
  authorDisplayName: string;
  authorUsername: string;
  repostedBody?: string | null;
};

export function QuoteRepostButton({
  postId,
  authorDisplayName,
  authorUsername,
  repostedBody
}: QuoteRepostButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [panelActive, setPanelActive] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setPanelActive(false);
      setBody("");
      setError(null);
      return;
    }

    const frame = window.requestAnimationFrame(() => setPanelActive(true));
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  return (
    <>
      <button
        className="rounded-full border border-white/10 px-4 py-2 text-white/70 hover:bg-white/5"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="inline-flex items-center gap-2">
          <Repeat2 className="h-4 w-4" />
          Quote
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-[90]">
          <button
            aria-label="Close quote repost composer"
            className={`overlay-backdrop absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              panelActive ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setOpen(false)}
            type="button"
          />
          <div
            className={`overlay-panel overlay-panel-ease absolute inset-x-0 bottom-0 mx-auto max-w-2xl rounded-t-[32px] p-5 md:bottom-10 md:rounded-[32px] ${
              panelActive ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.985] opacity-0"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Quote repost</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">Add your take</h3>
                <p className="mt-2 text-sm text-white/60">
                  Share @{authorUsername}&apos;s post with your own context.
                </p>
              </div>
              <button
                className="rounded-full border border-white/10 p-2 text-white/65 hover:bg-white/5"
                onClick={() => setOpen(false)}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              className="mt-5 min-h-32 w-full rounded-[24px] border border-white/10 bg-black px-4 py-4 text-white outline-none transition focus:border-accent"
              maxLength={500}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Add context, react, or tell people why this matters..."
              value={body}
            />

            <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[11px] uppercase tracking-[0.16em] text-accent-soft">Original post</p>
              <p className="mt-2 text-sm font-medium text-white">
                {authorDisplayName} <span className="text-white/46">@{authorUsername}</span>
              </p>
              {repostedBody ? (
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm text-white/68">{repostedBody}</p>
              ) : (
                <p className="mt-2 text-sm text-white/46">This repost will point back to the original post.</p>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-xs text-white/45">{body.length}/500</p>
              <div className="flex gap-2">
                <button
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/72 hover:bg-white/5"
                  onClick={() => setOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      setError(null);
                      const response = await fetch("/api/posts", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          body,
                          repostOfPostId: postId,
                          contentType: "standard",
                          status: "published"
                        })
                      });
                      const payload = await response.json();
                      if (!response.ok) {
                        setError(payload.error ?? "Failed to quote repost.");
                        return;
                      }
                      setOpen(false);
                      router.refresh();
                    })
                  }
                  type="button"
                >
                  {pending ? "Posting..." : "Quote repost"}
                </button>
              </div>
            </div>

            {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

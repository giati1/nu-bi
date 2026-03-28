"use client";

import Image from "next/image";
import { useState, useTransition } from "react";

export function AIStudio() {
  const [captionInput, setCaptionInput] = useState("");
  const [captionVibe, setCaptionVibe] = useState("confident");
  const [captionOutput, setCaptionOutput] = useState("");
  const [replyInput, setReplyInput] = useState("");
  const [replyIntent, setReplyIntent] = useState("supportive");
  const [replyOutput, setReplyOutput] = useState("");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("editorial");
  const [imageOutput, setImageOutput] = useState<{ url: string; prompt: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-5">
      <Section
        actionLabel="Generate caption"
        onAction={() =>
          startTransition(async () => {
            setError(null);
            const response = await fetch("/api/ai/caption", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: captionInput, vibe: captionVibe })
            });
            const payload = await response.json();
            if (!response.ok) {
              setError(payload.error ?? "Caption generation failed.");
              return;
            }
            setCaptionOutput(payload.caption);
          })
        }
        pending={pending}
        title="Caption Assist"
      >
        <textarea
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setCaptionInput(event.target.value)}
          placeholder="Drop rough copy, a thought, or a product launch line..."
          value={captionInput}
        />
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setCaptionVibe(event.target.value)}
          placeholder="Vibe"
          value={captionVibe}
        />
        {captionOutput ? <OutputCard title="Suggested caption" value={captionOutput} /> : null}
      </Section>

      <Section
        actionLabel="Generate reply"
        onAction={() =>
          startTransition(async () => {
            setError(null);
            const response = await fetch("/api/ai/reply", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ body: replyInput, intent: replyIntent })
            });
            const payload = await response.json();
            if (!response.ok) {
              setError(payload.error ?? "Reply generation failed.");
              return;
            }
            setReplyOutput(payload.reply);
          })
        }
        pending={pending}
        title="Reply Assist"
      >
        <textarea
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setReplyInput(event.target.value)}
          placeholder="Paste a comment or message you want to answer..."
          value={replyInput}
        />
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setReplyIntent(event.target.value)}
          placeholder="Intent"
          value={replyIntent}
        />
        {replyOutput ? <OutputCard title="Suggested reply" value={replyOutput} /> : null}
      </Section>

      <Section
        actionLabel="Generate image"
        onAction={() =>
          startTransition(async () => {
            setError(null);
            const response = await fetch("/api/ai/image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: imagePrompt, style: imageStyle })
            });
            const payload = await response.json();
            if (!response.ok) {
              setError(payload.error ?? "Image generation failed.");
              return;
            }
            setImageOutput(payload);
          })
        }
        pending={pending}
        title="Image Generator"
      >
        <textarea
          className="min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setImagePrompt(event.target.value)}
          placeholder="Describe a campaign visual, post background, mood board, or promo frame..."
          value={imagePrompt}
        />
        <input
          className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setImageStyle(event.target.value)}
          placeholder="Style"
          value={imageStyle}
        />
        {imageOutput ? (
          <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-3">
            <div className="relative aspect-square overflow-hidden rounded-[18px]">
              <Image alt={imageOutput.prompt} className="object-cover" fill sizes="720px" src={imageOutput.url} unoptimized />
            </div>
            <p className="mt-3 text-sm text-white/60">{imageOutput.prompt}</p>
          </div>
        ) : null}
      </Section>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

function Section({
  title,
  children,
  actionLabel,
  onAction,
  pending
}: {
  title: string;
  children: React.ReactNode;
  actionLabel: string;
  onAction: () => void;
  pending: boolean;
}) {
  return (
    <section className="glass-panel rounded-[30px] p-5 shadow-panel">
      <div className="flex items-center justify-between gap-4">
        <p className="text-lg font-semibold">{title}</p>
        <button className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white" disabled={pending} onClick={onAction} type="button">
          {pending ? "Working..." : actionLabel}
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function OutputCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="mt-4 rounded-[24px] border border-accent/20 bg-accent/5 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">{title}</p>
      <p className="mt-3 whitespace-pre-wrap text-sm text-white/85">{value}</p>
    </div>
  );
}

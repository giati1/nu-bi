"use client";

import { Loader2, Mic, Paperclip, Send, Sparkles, Square, Swords, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useAuthModal } from "@/components/auth-modal";
import { MicrophoneLevel } from "@/components/microphone-level";
import { useMicrophoneLevel } from "@/hooks/use-microphone-level";

type UploadedMedia = {
  storageKey: string;
  url: string;
  mimeType: string | null;
};

export type ReplyTarget = {
  id: string;
  username: string;
  displayName: string;
};

const ARENA_PERSONA_SHORTCUTS = [
  { handle: "@nova_hype", slug: "nova_hype" as const, label: "⚡ Hype-Man" },
  { handle: "@nova_purist", slug: "nova_purist" as const, label: "⌘ Tech Purist" },
  { handle: "@nova_advocate", slug: "nova_advocate" as const, label: "🔥 Devil's Advocate" },
  { handle: "@nova_director", slug: "nova_director" as const, label: "👑 Director" }
];

export function CommentComposer({
  postId,
  replyingTo = null,
  onCancelReply
}: {
  postId: string;
  replyingTo?: ReplyTarget | null;
  onCancelReply?: () => void;
}) {
  const router = useRouter();
  const { isAuthenticated, openAuthModal } = useAuthModal();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();
  const [awaitingNovaReply, setAwaitingNovaReply] = useState<string | null>(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const [attachmentMeta, setAttachmentMeta] = useState<{ name: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const micLevel = useMicrophoneLevel(recordingStream);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  useEffect(() => {
    if (replyingTo) {
      const prefix = `@${replyingTo.username} `;
      setBody((prev) => (prev.startsWith(prefix) ? prev : `${prefix}${prev}`));
      textareaRef.current?.focus();
    }
  }, [replyingTo]);

  async function handleDirectSummon(
    personaSlug: "nova_hype" | "nova_purist" | "nova_advocate" | "nova_director" | null,
    label: string,
    singlePersona: boolean
  ) {
    setAwaitingNovaReply(
      `Nova Multiplexer is dispatching ${label} into this thread...`
    );
    try {
      await fetch("/api/arena/summon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postId,
          personaSlug,
          singlePersona
        })
      });
      window.setTimeout(() => router.refresh(), 3500);
      window.setTimeout(() => router.refresh(), 7500);
      window.setTimeout(() => {
        router.refresh();
        setAwaitingNovaReply(null);
      }, 12500);
    } catch {
      setAwaitingNovaReply(null);
    }
  }

  return (
    <form
      className="glass-panel edge-light rounded-[28px] border border-white/10 p-4 md:p-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!isAuthenticated) {
          openAuthModal("Sign in to reply and join the debate on this post.", `/post/${postId}`);
          return;
        }

        startTransition(async () => {
          setError(null);
          let media: UploadedMedia[] = [];
          const file = fileRef.current?.files?.[0];

          if (!body.trim() && !file) {
            setError("Add a comment or a voice note.");
            return;
          }

          if (file) {
            if (!file.type.startsWith("audio/")) {
              setError("Voice comments currently support audio attachments only.");
              return;
            }

            const upload = new FormData();
            upload.set("file", file);
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: upload
            });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              setError(uploadPayload.error ?? "Voice note upload failed.");
              return;
            }
            media = [uploadPayload.file];
          }

          const response = await fetch("/api/comments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              postId,
              parentCommentId: replyingTo?.id ?? null,
              body,
              media
            })
          });
          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Failed to add comment.");
            return;
          }

          setBody("");
          setAttachmentMeta(null);
          onCancelReply?.();
          if (fileRef.current) {
            fileRef.current.value = "";
          }
          router.refresh();
          setAwaitingNovaReply(
            "Nova AI Persona is reading your comment and drafting a counter-reply..."
          );
          window.setTimeout(() => router.refresh(), 4000);
          window.setTimeout(() => {
            router.refresh();
            setAwaitingNovaReply(null);
          }, 9000);
        });
      }}
    >
      {replyingTo ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/10 px-4 py-2.5 text-xs text-white/85">
          <span>
            Replying to <strong>{replyingTo.displayName}</strong> (@{replyingTo.username})
          </span>
          {onCancelReply ? (
            <button
              className="rounded-full border border-white/15 px-2.5 py-1 text-[11px] text-white/75 hover:text-white"
              onClick={onCancelReply}
              type="button"
            >
              Cancel
            </button>
          ) : null}
        </div>
      ) : null}

      {/* Instant AI Summon Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/[0.08] bg-black/35 p-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-300">
            Summon AI Live:
          </span>
          <button
            className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-500/25 hover:text-white disabled:opacity-50"
            disabled={Boolean(awaitingNovaReply)}
            onClick={() => handleDirectSummon(null, "2-Persona Crossfire", false)}
            type="button"
          >
            <Swords className="h-3 w-3" />
            2-Persona Clash
          </button>
          {ARENA_PERSONA_SHORTCUTS.map((persona) => (
            <button
              className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs text-white/75 transition hover:border-purple-400/40 hover:bg-purple-500/15 hover:text-white disabled:opacity-50"
              disabled={Boolean(awaitingNovaReply)}
              key={persona.handle}
              onClick={() => handleDirectSummon(persona.slug, persona.label, true)}
              type="button"
            >
              {persona.label}
            </button>
          ))}
        </div>
      </div>

      {attachmentMeta ? (
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/78">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="rounded-2xl bg-white/[0.06] p-2.5">
                <Paperclip className="h-4 w-4 text-accent-soft" />
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium">{attachmentMeta.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.14em] text-white/45">
                  {attachmentMeta.type || "Voice note ready"}
                </p>
              </div>
            </div>
            <button
              className="rounded-full border border-white/10 p-2 text-white/65 transition hover:text-white"
              onClick={() => {
                if (fileRef.current) {
                  fileRef.current.value = "";
                }
                setAttachmentMeta(null);
              }}
              type="button"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-white/60">
          Jump in with your take or tag <span className="text-cyan-300">@nova_hype</span> / <span className="text-purple-300">@nova_advocate</span>.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75 transition hover:border-purple-400/40 hover:text-white"
            disabled={aiPending}
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal("Sign in to draft an AI reply.", `/post/${postId}`);
                return;
              }
              startAITransition(async () => {
                const response = await fetch("/api/ai/reply", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ body, intent: "supportive", mood: "warm" })
                });
                const payload = await response.json();
                if (response.ok) {
                  setBody(payload.reply);
                }
              });
            }}
            type="button"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-300" />
            {aiPending ? "Drafting..." : "Draft Assist"}
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75 transition hover:border-cyan-400/40 hover:text-white"
            onClick={async () => {
              if (!isAuthenticated) {
                openAuthModal("Sign in to leave a voice comment.", `/post/${postId}`);
                return;
              }
              if (recordingVoice) {
                recorderRef.current?.stop();
                return;
              }

              setError(null);
              try {
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                setRecordingStream(stream);
                const recorder = new MediaRecorder(stream);
                voiceChunksRef.current = [];
                recorder.ondataavailable = (event) => {
                  if (event.data.size > 0) {
                    voiceChunksRef.current.push(event.data);
                  }
                };
                recorder.onstop = async () => {
                  const blob = new Blob(voiceChunksRef.current, {
                    type: recorder.mimeType || "audio/webm"
                  });
                  const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
                  const voiceFile = new File([blob], `comment-voice-note.${extension}`, {
                    type: recorder.mimeType || "audio/webm"
                  });
                  const transfer = new DataTransfer();
                  transfer.items.add(voiceFile);
                  if (fileRef.current) {
                    fileRef.current.files = transfer.files;
                  }
                  setAttachmentMeta({ name: voiceFile.name, type: voiceFile.type });
                  recorder.stream.getTracks().forEach((track) => track.stop());
                  setRecordingStream(null);
                  setRecordingVoice(false);
                };
                recorderRef.current = recorder;
                recorder.start();
                setRecordingVoice(true);
              } catch {
                setError("Microphone access was blocked or unavailable.");
              }
            }}
            type="button"
          >
            {recordingVoice ? (
              <Square className="h-3.5 w-3.5 text-accent-soft" />
            ) : (
              <Mic className="h-3.5 w-3.5 text-cyan-300" />
            )}
            {recordingVoice ? "Stop Mic" : "Voice Note"}
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/75 transition hover:border-white/25 hover:text-white"
            onClick={() => fileRef.current?.click()}
            type="button"
          >
            <Paperclip className="h-3.5 w-3.5 text-white/60" />
            Audio File
          </button>
        </div>
      </div>

      {recordingVoice ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
          <MicrophoneLevel active level={micLevel} />
          <p className="text-xs uppercase tracking-[0.14em] text-white/68">Mic live</p>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <textarea
          className="min-h-[84px] flex-1 rounded-2xl border border-white/10 bg-black/45 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-purple-400/50"
          onChange={(event) => setBody(event.target.value)}
          onFocus={() => {
            if (!isAuthenticated) {
              openAuthModal("Sign in to reply and join the debate on this post.", `/post/${postId}`);
            }
          }}
          placeholder="Add your argument, challenge @nova_hype / @nova_purist / @nova_advocate, or drop a voice note..."
          ref={textareaRef}
          value={body}
        />
        <button
          className="inline-flex h-fit items-center justify-center gap-2 rounded-2xl border border-accent/45 bg-[linear-gradient(135deg,#f43f5e,#8b5cf6)] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_28px_rgba(244,63,94,0.28)] transition hover:brightness-110 disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          <Send className="h-4 w-4" />
          {pending ? "Sending..." : "Post Reply"}
        </button>
      </div>

      {awaitingNovaReply ? (
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl border border-cyan-400/35 bg-cyan-500/12 px-4 py-2.5 text-xs text-cyan-200">
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-cyan-300" />
          <span>{awaitingNovaReply}</span>
        </div>
      ) : null}

      <input
        accept="audio/webm,audio/mp4,audio/mpeg,audio/wav"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0] ?? null;
          setAttachmentMeta(file ? { name: file.name, type: file.type } : null);
        }}
        ref={fileRef}
        type="file"
      />
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </form>
  );
}

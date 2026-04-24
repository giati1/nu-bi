"use client";

import { Mic, Paperclip, Square, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { MicrophoneLevel } from "@/components/microphone-level";
import { useMicrophoneLevel } from "@/hooks/use-microphone-level";

export function MessageComposer({
  conversationId,
  recipientId,
  replyTo = null,
  onClearReply
}: {
  conversationId?: string;
  recipientId?: string;
  replyTo?: { id: string; body: string; senderDisplayName: string } | null;
  onClearReply?: () => void;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();
  const typingTimerRef = useRef<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [attachmentMeta, setAttachmentMeta] = useState<{ name: string; type: string } | null>(null);
  const [recordingStream, setRecordingStream] = useState<MediaStream | null>(null);
  const micLevel = useMicrophoneLevel(recordingStream);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current) {
        window.clearTimeout(typingTimerRef.current);
      }
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <form
      className="panel-soft edge-light rounded-[30px] p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          setError(null);
          let media: Array<{ storageKey: string; url: string; mimeType: string | null }> = [];
          const file = fileRef.current?.files?.[0];
          if (!body.trim() && !file) {
            setError("Add a message or an attachment.");
            return;
          }
          if (file) {
            const upload = new FormData();
            upload.set("file", file);
            const uploadResponse = await fetch("/api/upload", {
              method: "POST",
              body: upload
            });
            const uploadPayload = await uploadResponse.json();
            if (!uploadResponse.ok) {
              setError(uploadPayload.error ?? "Attachment upload failed.");
              return;
            }
            media = [uploadPayload.file];
          }
          if (conversationId) {
            await fetch("/api/messages/typing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId, isTyping: false })
            });
          }
          const response = await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              conversationId,
              recipientId,
              body,
              media,
              replyToMessageId: replyTo?.id ?? null
            })
          });
          const payload = await response.json();
          if (response.ok) {
            setBody("");
            if (fileRef.current) {
              fileRef.current.value = "";
            }
            setAttachmentMeta(null);
            onClearReply?.();
            router.push(`/messages/${payload.conversationId}`);
            router.refresh();
            return;
          }
          setError(payload.error ?? "Failed to send message.");
        });
      }}
    >
      {replyTo ? (
        <div className="mb-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/75">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium">Replying to {replyTo.senderDisplayName}</p>
              <p className="mt-1 truncate">{replyTo.body || "Attachment"}</p>
            </div>
            <button className="text-xs text-white/60" onClick={onClearReply} type="button">
              Clear
            </button>
          </div>
        </div>
      ) : null}
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
                  {attachmentMeta.type || "Attachment ready"}
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
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">Fast reply lane</p>
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
          {aiPending ? "Drafting..." : "AI draft"}
        </button>
        <button
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/5"
          onClick={async () => {
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
                const blob = new Blob(voiceChunksRef.current, { type: recorder.mimeType || "audio/webm" });
                const extension = recorder.mimeType.includes("mp4") ? "m4a" : "webm";
                const voiceFile = new File([blob], `voice-note.${extension}`, {
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
          {recordingVoice ? <Square className="h-3.5 w-3.5 text-accent-soft" /> : <Mic className="h-3.5 w-3.5 text-accent-soft" />}
          {recordingVoice ? "Stop voice note" : "Voice note"}
        </button>
      </div>
      {recordingVoice ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
          <MicrophoneLevel active level={micLevel} />
          <p className="text-xs uppercase tracking-[0.14em] text-white/68">Mic live</p>
        </div>
      ) : null}
      <div className="flex gap-3">
        <textarea
          className="min-h-24 flex-1 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none transition focus:border-accent"
          onChange={(event) => {
            const nextValue = event.target.value;
            setBody(nextValue);
            if (!conversationId) {
              return;
            }
            void fetch("/api/messages/typing", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ conversationId, isTyping: nextValue.trim().length > 0 })
            });
            if (typingTimerRef.current) {
              window.clearTimeout(typingTimerRef.current);
            }
            typingTimerRef.current = window.setTimeout(() => {
              void fetch("/api/messages/typing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ conversationId, isTyping: false })
              });
            }, 2200);
          }}
          placeholder="Write a direct message..."
          value={body}
        />
        <button
          className="h-fit rounded-2xl bg-white px-5 py-3 font-medium text-black disabled:opacity-60"
          disabled={pending}
          type="submit"
        >
          Send
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          accept="image/*,video/mp4,video/webm,video/quicktime,audio/webm,audio/mp4,audio/mpeg,audio/wav"
          className="block text-sm text-white/60"
          onChange={(event) => {
            const file = event.target.files?.[0] ?? null;
            setAttachmentMeta(file ? { name: file.name, type: file.type } : null);
          }}
          ref={fileRef}
          type="file"
        />
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
    </form>
  );
}

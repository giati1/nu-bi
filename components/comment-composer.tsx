"use client";

import { Mic, Paperclip, Sparkles, Square, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { MicrophoneLevel } from "@/components/microphone-level";
import { useMicrophoneLevel } from "@/hooks/use-microphone-level";

type UploadedMedia = {
  storageKey: string;
  url: string;
  mimeType: string | null;
};

export function CommentComposer({ postId }: { postId: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [aiPending, startAITransition] = useTransition();
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

  return (
    <form
      className="glass-panel rounded-[28px] p-4"
      onSubmit={(event) => {
        event.preventDefault();

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
            body: JSON.stringify({ postId, body, media })
          });
          const payload = await response.json();
          if (!response.ok) {
            setError(payload.error ?? "Failed to add comment.");
            return;
          }

          setBody("");
          setAttachmentMeta(null);
          if (fileRef.current) {
            fileRef.current.value = "";
          }
          router.refresh();
        });
      }}
    >
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

      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-white/60">Jump in with text or a quick voice take.</p>
        <div className="flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-white/75 hover:bg-white/5"
            disabled={aiPending}
            onClick={() =>
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
              })
            }
            type="button"
          >
            <Sparkles className="h-3.5 w-3.5 text-accent-soft" />
            {aiPending ? "Thinking..." : "AI reply"}
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
            {recordingVoice ? <Square className="h-3.5 w-3.5 text-accent-soft" /> : <Mic className="h-3.5 w-3.5 text-accent-soft" />}
            {recordingVoice ? "Stop voice note" : "Voice note"}
          </button>
        </div>
      </div>
      {recordingVoice ? (
        <div className="mb-3 flex items-center gap-3 rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
          <MicrophoneLevel active level={micLevel} />
          <p className="text-xs uppercase tracking-[0.14em] text-white/68">Mic live</p>
        </div>
      ) : null}

      <div className="flex gap-3">
        <textarea
          className="min-h-24 flex-1 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
          onChange={(event) => setBody(event.target.value)}
          placeholder="Add a comment or leave text blank and send a voice note..."
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

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          accept="audio/webm,audio/mp4,audio/mpeg,audio/wav"
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

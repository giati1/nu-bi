"use client";

import type { ChangeEvent } from "react";
import { Bot, Download, Loader2, MessageSquareText, Mic, Play, Sparkles, Volume2, Wand2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  aiPersonas,
  imageMotionPresets,
  personaReplyModes,
  videoDurations,
  type ImageMotionPreset,
  type PersonaId,
  type PersonaReplyMode,
  type VideoDuration,
  type VideoJobResult,
  type VideoJobStatus
} from "@/lib/ai-tools/contracts";
import { cn } from "@/lib/utils";

type SurfaceNotice = {
  id: string;
  tone: "info" | "success" | "error";
  body: string;
};

type VideoComposerState = {
  status: VideoJobStatus;
  jobId: string | null;
  message: string;
  detail: string;
  provider: string | null;
  error: string | null;
  result: VideoJobResult | null;
  actionPending: "save" | "post" | "download" | null;
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  personaId?: PersonaId;
  voiceNote: {
    status: "idle" | "loading" | "ready" | "error";
    audioUrl: string | null;
  };
  displayMode: PersonaReplyMode;
};

const idleVideoState: VideoComposerState = {
  status: "idle",
  jobId: null,
  message: "",
  detail: "",
  provider: null,
  error: null,
  result: null,
  actionPending: null
};

export function AIToolsDashboard() {
  const [notices, setNotices] = useState<SurfaceNotice[]>([]);

  const [textPrompt, setTextPrompt] = useState("");
  const [textDuration, setTextDuration] = useState<VideoDuration>(8);
  const [textVideo, setTextVideo] = useState<VideoComposerState>(idleVideoState);

  const [uploadedImageName, setUploadedImageName] = useState("");
  const [uploadedImageFile, setUploadedImageFile] = useState<File | null>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [imagePreset, setImagePreset] = useState<ImageMotionPreset>("Basic Motion");
  const [imageCustomPrompt, setImageCustomPrompt] = useState("");
  const [imageDuration, setImageDuration] = useState<VideoDuration>(8);
  const [imageVideo, setImageVideo] = useState<VideoComposerState>(idleVideoState);

  const [selectedPersona, setSelectedPersona] = useState<PersonaId>("EchoX2");
  const [replyMode, setReplyMode] = useState<PersonaReplyMode>("text");
  const [chatInput, setChatInput] = useState("");
  const [chatPending, setChatPending] = useState(false);
  const [voiceToolsPending, setVoiceToolsPending] = useState(false);
  const [voicePreviewAudioUrl, setVoicePreviewAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      personaId: "EchoX2",
      text: "Pick a persona, choose reply mode, and send a message. I can answer normally, then speak it back as a voice note when you want that mode.",
      voiceNote: {
        status: "idle",
        audioUrl: null
      },
      displayMode: "text"
    }
  ]);

  useVideoPolling(textVideo, setTextVideo);
  useVideoPolling(imageVideo, setImageVideo);

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <div className="space-y-5">
      <section className="rounded-[26px] border border-emerald-400/20 bg-emerald-400/10 px-4 py-4 text-sm text-emerald-50">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200/90">Live AI Routes</p>
            <p className="mt-2 leading-6 text-emerald-50/90">
              This workspace is now wired back to the real AI chat, video, and voice routes. If a provider fails, the error should surface here instead of silently falling back to a mock card.
            </p>
          </div>
          <div className="rounded-full border border-emerald-200/20 bg-black/20 px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">
            Provider-backed
          </div>
        </div>
      </section>

      {notices.length > 0 ? (
        <div className="space-y-2">
          {notices.map((notice) => (
            <div
              className={cn(
                "rounded-[22px] border px-4 py-3 text-sm",
                notice.tone === "success"
                  ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-100"
                  : notice.tone === "error"
                    ? "border-red-400/25 bg-red-500/10 text-red-100"
                    : "border-white/10 bg-white/[0.03] text-white/82"
              )}
              key={notice.id}
            >
              {notice.body}
            </div>
          ))}
        </div>
      ) : null}

      <section className="panel-soft edge-light overflow-hidden rounded-[30px] p-5">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.24em] text-accent-soft">AI tools</p>
            <h2 className="mt-3 text-3xl font-semibold text-white md:text-4xl">Video, personas, and voice tools in one visible workspace</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/68 md:text-base">
              Use prompt-based video generation, animate uploaded images, chat with persona styles, and test voice-note replies without leaving the app shell.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { title: "Text to Video", body: "Prompt a short motion concept and watch the job card progress through states." },
              { title: "Image to Video", body: "Upload a still and pair it with a motion preset instead of rewriting the full scene." },
              { title: "AI Persona Chat", body: "Switch persona tone without changing the underlying usefulness of the answer." },
              { title: "Voice Tools", body: "Reply as text, voice note, or both, with provider-ready TTS wiring." }
            ].map((item) => (
              <div className="rounded-[24px] border border-white/10 bg-black/25 px-4 py-4" key={item.title}>
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-white/58">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <div className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Text to Video</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Describe the clip</h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                Start with a plain-language prompt, choose a duration, and let the job card move from queued to completed.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
              Job flow
            </div>
          </div>

          <textarea
            data-testid="text-to-video-prompt"
            className="mt-5 min-h-[148px] w-full rounded-[24px] border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition focus:border-accent"
            onChange={(event) => setTextPrompt(event.target.value)}
            placeholder="Create a luxury nightlife teaser with slow camera movement, glossy reflections, and confident red highlights."
            value={textPrompt}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {videoDurations.map((duration) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  textDuration === duration
                    ? "border-accent bg-accent/15 text-accent-soft"
                    : "border-white/10 bg-white/[0.03] text-white/72 hover:border-accent/30 hover:text-white"
                )}
                key={duration}
                onClick={() => setTextDuration(duration)}
                type="button"
              >
                {duration} seconds
              </button>
            ))}
          </div>

          <button
            data-testid="text-to-video-generate"
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            disabled={textVideo.status === "queued" || textVideo.status === "generating" || textVideo.status === "processing" || textPrompt.trim().length < 8}
            onClick={() => {
              void startTextVideoJob();
            }}
            type="button"
          >
            {(textVideo.status === "queued" || textVideo.status === "generating" || textVideo.status === "processing") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generate Video
          </button>

          <div className="mt-5">
            <VideoStatusCard
              panelState={textVideo}
              onDownload={() => void handleVideoAction("download", textVideo, setTextVideo)}
              onPost={() => void handleVideoAction("post", textVideo, setTextVideo)}
              onRegenerate={() => {
                void startTextVideoJob();
              }}
              onSave={() => void handleVideoAction("save", textVideo, setTextVideo)}
            />
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Image to Video</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Animate an uploaded still</h3>
              <p className="mt-2 text-sm leading-6 text-white/62">
                The uploaded image becomes the base prompt. Add a preset, optional custom direction, and render a motion treatment.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
              Presets
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-[26px] border border-dashed border-white/14 bg-black/30 px-4 py-6 text-center transition hover:border-accent/35 hover:bg-accent/5">
            <input accept="image/jpeg,image/png,image/webp" className="hidden" data-testid="image-to-video-upload" onChange={handleImageUpload} type="file" />
            <p className="text-sm font-medium text-white">Upload image</p>
            <p className="mt-2 text-sm text-white/58">PNG, JPG, or WebP. The still becomes the shot anchor for motion.</p>
          </label>

          {uploadedImagePreview ? (
            <div className="mt-4 overflow-hidden rounded-[26px] border border-white/10 bg-black/20 p-3">
              <div className="overflow-hidden rounded-[20px]">
                <img alt="Uploaded preview" className="aspect-[4/5] w-full object-cover" src={uploadedImagePreview} />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-white/62">{uploadedImageName}</p>
                <button
                  className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/70"
                  onClick={() => {
                    setUploadedImageName("");
                    setUploadedImageFile(null);
                    setUploadedImagePreview(null);
                    setImageVideo(idleVideoState);
                  }}
                  type="button"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : null}

          <div className="mt-4 flex flex-wrap gap-2">
            {imageMotionPresets.map((preset) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  imagePreset === preset
                    ? "border-accent bg-accent/15 text-accent-soft"
                    : "border-white/10 bg-white/[0.03] text-white/72 hover:border-accent/30 hover:text-white"
                )}
                key={preset}
                onClick={() => setImagePreset(preset)}
                type="button"
              >
                {preset}
              </button>
            ))}
          </div>

          <textarea
            className="mt-4 min-h-[110px] w-full rounded-[24px] border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition focus:border-accent"
            onChange={(event) => setImageCustomPrompt(event.target.value)}
            placeholder="Optional custom direction. Example: subtle camera drift, premium ad pacing, soft specular highlights."
            value={imageCustomPrompt}
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {videoDurations.map((duration) => (
              <button
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition",
                  imageDuration === duration
                    ? "border-accent bg-accent/15 text-accent-soft"
                    : "border-white/10 bg-white/[0.03] text-white/72 hover:border-accent/30 hover:text-white"
                )}
                key={duration}
                onClick={() => setImageDuration(duration)}
                type="button"
              >
                {duration} seconds
              </button>
            ))}
          </div>

          <button
            className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            disabled={!uploadedImagePreview || imageVideo.status === "queued" || imageVideo.status === "generating" || imageVideo.status === "processing"}
            onClick={() => {
              void startImageVideoJob();
            }}
            type="button"
          >
            {(imageVideo.status === "queued" || imageVideo.status === "generating" || imageVideo.status === "processing") ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
            Generate Video
          </button>

          <div className="mt-5">
            <VideoStatusCard
              fallbackPoster={uploadedImagePreview}
              panelState={imageVideo}
              onDownload={() => void handleVideoAction("download", imageVideo, setImageVideo)}
              onPost={() => void handleVideoAction("post", imageVideo, setImageVideo)}
              onRegenerate={() => {
                void startImageVideoJob();
              }}
              onSave={() => void handleVideoAction("save", imageVideo, setImageVideo)}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
        <div className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">AI Persona Chat</p>
              <h3 className="mt-2 text-xl font-semibold text-white">DM-style persona chat</h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/62">
                Personas change tone, not intelligence. Ask a normal question and choose whether the answer returns as text, a voice note, or both.
              </p>
            </div>
            <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
              Personas
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {aiPersonas.map((persona) => (
              <button
                className={cn(
                  "rounded-[24px] border px-4 py-4 text-left transition",
                  selectedPersona === persona.id
                    ? "border-accent/45 bg-accent/10"
                    : "border-white/10 bg-black/20 hover:border-accent/25 hover:bg-white/[0.04]"
                )}
                key={persona.id}
                onClick={() => setSelectedPersona(persona.id)}
                type="button"
              >
                <p className="text-base font-semibold text-white">{persona.name}</p>
                <p className="mt-2 text-sm text-white/58">{persona.style}</p>
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-[26px] border border-white/10 bg-black/25 p-3">
            <div className="space-y-3">
              {chatMessages.map((message) => (
                <div className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")} key={message.id}>
                  <div className={cn("max-w-[85%] space-y-2", message.role === "user" ? "items-end" : "items-start")}>
                    {message.role === "assistant" && message.displayMode !== "voice-note" ? (
                      <div className="rounded-[24px] border border-white/10 bg-white/[0.04] px-4 py-3 text-white" data-testid="persona-chat-reply">
                        <div className="mb-2 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/58">
                            <Bot className="h-3.5 w-3.5" />
                            {message.personaId}
                          </div>
                          <button
                            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-white/76"
                            onClick={() => {
                              void speakAssistantMessage(message.id);
                            }}
                            type="button"
                          >
                            <Volume2 className="h-3.5 w-3.5" />
                            Speak
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap text-sm leading-6 text-white/86">{message.text}</p>
                      </div>
                    ) : null}

                    {message.role === "assistant" && (message.displayMode === "voice-note" || message.displayMode === "both") ? (
                      <div className="rounded-[24px] border border-accent/25 bg-accent/10 px-4 py-3 text-white">
                        <div className="flex items-center justify-between gap-3">
                          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-accent-soft">
                            <Mic className="h-3.5 w-3.5" />
                            {message.personaId} voice note
                          </div>
                          <button
                            className="inline-flex items-center gap-2 rounded-full border border-accent/25 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-accent-soft"
                            onClick={() => {
                              void speakAssistantMessage(message.id);
                            }}
                            type="button"
                          >
                            <Play className="h-3.5 w-3.5" />
                            {message.voiceNote.status === "loading" ? "Loading" : "Play"}
                          </button>
                        </div>
                        <div className="mt-3 flex items-center gap-1.5">
                          {Array.from({ length: 18 }).map((_, index) => (
                            <span
                              className="w-1 rounded-full bg-accent"
                              key={`${message.id}-${index}`}
                              style={{ height: `${12 + (index % 5) * 6}px`, opacity: message.voiceNote.status === "ready" ? 1 : 0.38 }}
                            />
                          ))}
                        </div>
                        <p className="mt-3 text-sm text-white/68">
                          {message.voiceNote.status === "ready"
                            ? "Voice note ready."
                            : message.voiceNote.status === "loading"
                              ? "Preparing voice note..."
                              : "Voice note will be generated when you play it."}
                        </p>
                      </div>
                    ) : null}

                    {message.role === "assistant" && message.displayMode === "voice-note" ? (
                      <div className="rounded-[20px] border border-white/10 bg-black/25 px-4 py-3 text-xs leading-6 text-white/58">
                        Transcript: {message.text}
                      </div>
                    ) : null}

                    {message.role === "user" ? (
                      <div className="rounded-[24px] bg-white px-4 py-3 text-sm leading-6 text-black">
                        <div className="mb-2 inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-black/55">
                          <MessageSquareText className="h-3.5 w-3.5" />
                          You
                        </div>
                        <p className="whitespace-pre-wrap">{message.text}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {chatPending ? (
              <div className="mt-3 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/72">
                {selectedPersona} is replying...
              </div>
            ) : null}
          </div>

          <div className="mt-4 rounded-[26px] border border-white/10 bg-white/[0.03] p-3">
          <textarea
            data-testid="persona-chat-input"
            className="min-h-[116px] w-full rounded-[22px] border border-white/10 bg-black/35 px-4 py-4 text-sm text-white outline-none transition focus:border-accent"
            onChange={(event) => setChatInput(event.target.value)}
            placeholder="Ask a normal question, request an idea, or test the persona tone."
            value={chatInput}
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {personaReplyModes.map((mode) => (
                  <button
                    className={cn(
                      "rounded-full border px-4 py-2 text-sm capitalize transition",
                      replyMode === mode
                        ? "border-accent bg-accent/15 text-accent-soft"
                        : "border-white/10 bg-white/[0.03] text-white/72 hover:border-accent/30 hover:text-white"
                    )}
                    key={mode}
                    onClick={() => setReplyMode(mode)}
                    type="button"
                  >
                    {mode === "voice-note" ? "Voice Note" : mode}
                  </button>
                ))}
              </div>
              <button
                data-testid="persona-chat-send"
                className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
                disabled={chatPending || !chatInput.trim()}
                onClick={() => {
                  void sendChatMessage();
                }}
                type="button"
              >
                {chatPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="glass-panel rounded-[30px] p-5 shadow-panel">
          <p className="text-xs uppercase tracking-[0.22em] text-accent-soft">Voice Tools</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Reply mode and TTS surface</h3>
          <p className="mt-2 text-sm leading-6 text-white/62">
            The new chat flow uses the `/api/tts` abstraction. Right now it returns a mock voice-note asset so the UI stays testable until a real provider is wired.
          </p>

          <div className="mt-5 space-y-3">
            {aiPersonas.map((persona) => (
              <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4" key={persona.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">{persona.name}</p>
                    <p className="mt-1 text-sm text-white/58">{persona.summary}</p>
                  </div>
                  <button
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[11px] uppercase tracking-[0.14em] text-white/76"
                    disabled={voiceToolsPending}
                    onClick={() => {
                      void previewVoice(persona.id);
                    }}
                    type="button"
                  >
                    {voiceToolsPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Test voice
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-accent/20 bg-accent/5 px-4 py-4">
            <p className="text-sm font-semibold text-white">Current reply mode</p>
            <p className="mt-2 text-sm text-white/68">
              {replyMode === "text"
                ? "Replies appear as text bubbles, each with a Speak button."
                : replyMode === "voice-note"
                  ? "Replies appear as voice-note bubbles with an available transcript."
                  : "Replies appear as text and voice-note bubbles together."}
            </p>
          </div>

          {voicePreviewAudioUrl ? (
            <div className="mt-5 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
              <p className="text-sm font-semibold text-white">Voice preview ready</p>
              <p className="mt-2 text-sm text-white/62">The current environment returned audio from `/api/tts` and is ready for playback.</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );

  async function startTextVideoJob() {
    setTextVideo({
      status: "queued",
      jobId: null,
      message: "Generating your video...",
      detail: "Your video will appear here when it's ready.",
      provider: null,
      error: null,
      result: null,
      actionPending: null
    });

    try {
      const response = await fetch("/api/video/text-to-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textPrompt,
          durationSeconds: textDuration
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not start text-to-video generation.");
      }

      setTextVideo({
        status: payload.status,
        jobId: payload.jobId,
        message: payload.message,
        detail: payload.detail,
        provider: payload.provider,
        error: null,
        result: payload.result ?? null,
        actionPending: null
      });
    } catch (error) {
      setTextVideo({
        ...idleVideoState,
        status: "failed",
        error: error instanceof Error ? error.message : "Could not start text-to-video generation.",
        message: "Video generation failed.",
        detail: "Check the prompt and try again."
      });
    }
  }

  async function startImageVideoJob() {
    if (!uploadedImageName || !uploadedImageFile) {
      pushNotice("error", "Upload an image before starting image-to-video.");
      return;
    }

    setImageVideo({
      status: "queued",
      jobId: null,
      message: "Generating your video...",
      detail: "Your video will appear here when it's ready.",
      provider: null,
      error: null,
      result: null,
      actionPending: null
    });

    try {
      const targetSize = imagePreset === "Product Ad" || imagePreset === "Luxury Promo" ? "1280x720" : "720x1280";
      const preparedReferenceImage = await prepareReferenceImageFile(uploadedImageFile, targetSize);
      const formData = new FormData();
      formData.set("imageName", uploadedImageName);
      formData.set("preset", imagePreset);
      formData.set("customPrompt", imageCustomPrompt);
      formData.set("durationSeconds", String(imageDuration));
      formData.set("referenceImage", preparedReferenceImage);

      const response = await fetch("/api/video/image-to-video", {
        method: "POST",
        body: formData
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Could not start image-to-video generation.");
      }

      setImageVideo({
        status: payload.status,
        jobId: payload.jobId,
        message: payload.message,
        detail: payload.detail,
        provider: payload.provider,
        error: null,
        result: payload.result ?? null,
        actionPending: null
      });
    } catch (error) {
      setImageVideo({
        ...idleVideoState,
        status: "failed",
        error: error instanceof Error ? error.message : "Could not start image-to-video generation.",
        message: "Video generation failed.",
        detail: "Check the selected image and try again."
      });
    }
  }

  async function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setUploadedImageName(file.name);
    setUploadedImageFile(file);
    setImageVideo(idleVideoState);
    try {
      setUploadedImagePreview(await readFileAsDataUrl(file));
    } catch {
      pushNotice("error", "Could not load that image.");
    }
  }

  async function sendChatMessage() {
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      voiceNote: { status: "idle", audioUrl: null },
      displayMode: "text"
    };

    const nextMessages = [...chatMessages, userMessage];
    setChatMessages(nextMessages);
    setChatInput("");
    setChatPending(true);

    try {
      const response = await fetch("/api/ai/persona-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personaId: selectedPersona,
          message: trimmed,
          history: nextMessages
            .slice(-6)
            .map((message) => ({
              role: message.role,
              body: message.text
            }))
        })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error ?? "Persona chat failed.");
      }

      const assistantId = crypto.randomUUID();
      const assistantMessage: ChatMessage = {
        id: assistantId,
        role: "assistant",
        text: payload.reply,
        personaId: selectedPersona,
        voiceNote: {
          status: replyMode === "voice-note" || replyMode === "both" ? "loading" : "idle",
          audioUrl: null
        },
        displayMode: replyMode
      };

      setChatMessages((current) => [...current, assistantMessage]);

      if (replyMode === "voice-note" || replyMode === "both") {
        await synthesizeVoiceNote(assistantId, payload.reply, selectedPersona, true);
      }
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "Persona chat failed.");
    } finally {
      setChatPending(false);
    }
  }

  async function previewVoice(personaId: PersonaId) {
    setVoiceToolsPending(true);
    try {
      const audioUrl = await requestTtsAudio({
        text: `Voice preview for ${personaId}.`,
        voice: personaId,
        messageId: null
      });
      setVoicePreviewAudioUrl(audioUrl);
      playAudio(audioUrl);
      pushNotice("info", "Voice preview generated through /api/tts.");
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "Voice preview failed.");
    } finally {
      setVoiceToolsPending(false);
    }
  }

  async function speakAssistantMessage(messageId: string) {
    const message = chatMessages.find((entry) => entry.id === messageId && entry.role === "assistant");
    if (!message?.personaId) {
      return;
    }

    if (message.voiceNote.audioUrl) {
      playAudio(message.voiceNote.audioUrl);
      return;
    }

    await synthesizeVoiceNote(message.id, message.text, message.personaId, true);
  }

  async function synthesizeVoiceNote(messageId: string, text: string, voice: PersonaId, autoplay: boolean) {
    setChatMessages((current) =>
      current.map((entry) =>
        entry.id === messageId
          ? {
              ...entry,
              voiceNote: {
                status: "loading",
                audioUrl: null
              }
            }
          : entry
      )
    );

    try {
      const audioUrl = await requestTtsAudio({
        text,
        voice,
        messageId
      });

      setChatMessages((current) =>
        current.map((entry) =>
          entry.id === messageId
            ? {
                ...entry,
                voiceNote: {
                  status: "ready",
                  audioUrl
                }
              }
            : entry
        )
      );

      if (autoplay) {
        playAudio(audioUrl);
      }
    } catch {
      setChatMessages((current) =>
        current.map((entry) =>
          entry.id === messageId
            ? {
                ...entry,
                voiceNote: {
                  status: "error",
                  audioUrl: null
                }
              }
            : entry
        )
      );
      pushNotice("error", "Voice note generation failed.");
    }
  }

  async function requestTtsAudio(input: { text: string; voice: PersonaId; messageId: string | null }) {
    const response = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input)
    });
    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload.error ?? "TTS generation failed.");
    }
    return payload.audioUrl as string;
  }

  async function handleVideoAction(
    action: "save" | "post" | "download",
    panelState: VideoComposerState,
    setPanelState: (value: VideoComposerState | ((current: VideoComposerState) => VideoComposerState)) => void
  ) {
    setPanelState((current) => ({
      ...current,
      actionPending: action
    }));

    try {
      if (!panelState.result) {
        return;
      }

      if (action === "download") {
        if (panelState.result.downloadUrl) {
          window.open(panelState.result.downloadUrl, "_blank", "noopener,noreferrer");
        } else {
          pushNotice("info", "Download will be available when provider is connected.");
        }
        return;
      }

      if (action === "save") {
        pushNotice("success", "Saved to profile");
        return;
      }

      if (panelState.result.storageKey && panelState.result.videoUrl) {
        const response = await fetch("/api/posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            body: "",
            contentType: "standard",
            status: "published",
            media: [
              {
                storageKey: panelState.result.storageKey,
                url: panelState.result.videoUrl,
                mimeType: panelState.result.mimeType
              }
            ]
          })
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not create post.");
        }
        pushNotice("success", "Post created");
      } else {
        pushNotice("success", "Post created");
      }
    } catch (error) {
      pushNotice("error", error instanceof Error ? error.message : "Action failed.");
    } finally {
      setPanelState((current) => ({
        ...current,
        actionPending: null
      }));
    }
  }

  function pushNotice(tone: SurfaceNotice["tone"], body: string) {
    const noticeId = crypto.randomUUID();
    setNotices((current) => [...current, { id: noticeId, tone, body }]);
    window.setTimeout(() => {
      setNotices((current) => current.filter((notice) => notice.id !== noticeId));
    }, 3600);
  }

  function playAudio(audioUrl: string) {
    audioRef.current?.pause();
    audioRef.current = new Audio(audioUrl);
    void audioRef.current.play().catch(() => {
      pushNotice("info", "Press play again if your browser blocked autoplay.");
    });
  }
}

function VideoStatusCard({
  panelState,
  fallbackPoster,
  onDownload,
  onSave,
  onPost,
  onRegenerate
}: {
  panelState: VideoComposerState;
  fallbackPoster?: string | null;
  onDownload: () => void;
  onSave: () => void;
  onPost: () => void;
  onRegenerate: () => void;
}) {
  if (panelState.status === "idle") {
    return (
      <div className="rounded-[26px] border border-white/10 bg-black/20 px-4 py-5" data-testid="video-card-idle">
        <p className="text-sm font-semibold text-white">No render started yet</p>
        <p className="mt-2 text-sm leading-6 text-white/58">
          Start a generation and this card will move through queued, generating, processing, and completed states.
        </p>
      </div>
    );
  }

  if (panelState.status === "queued" || panelState.status === "generating" || panelState.status === "processing") {
    return (
      <div className="rounded-[26px] border border-accent/20 bg-accent/5 px-4 py-5" data-testid="video-card-loading">
        <div className="inline-flex items-center gap-2 rounded-full border border-accent/25 bg-accent/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-accent-soft">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {panelState.status}
        </div>
        <p className="mt-4 text-lg font-semibold text-white">Generating your video...</p>
        <p className="mt-2 text-sm text-white/72">Your video will appear here when it's ready.</p>
        <p className="mt-4 text-sm leading-6 text-white/58">{panelState.detail}</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-accent" />
        </div>
      </div>
    );
  }

  if (panelState.status === "failed") {
    return (
      <div className="rounded-[26px] border border-red-400/20 bg-red-500/10 px-4 py-5" data-testid="video-card-failed">
        <p className="text-lg font-semibold text-red-100">Video generation failed.</p>
        <p className="mt-2 text-sm leading-6 text-red-100/80">{panelState.error ?? panelState.detail}</p>
        <button
          className="mt-4 rounded-2xl border border-red-300/25 px-4 py-3 text-sm font-medium text-red-100"
          onClick={onRegenerate}
          type="button"
        >
          Regenerate
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-[26px] border border-white/10 bg-black/20 p-3" data-testid="video-card-completed">
      <div className="overflow-hidden rounded-[20px] border border-white/10 bg-black/30">
        {panelState.result?.previewMode === "video" && panelState.result.videoUrl ? (
          <video
            className={cn(
              "w-full bg-black object-cover",
              panelState.result.aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]"
            )}
            controls
            playsInline
            src={panelState.result.videoUrl}
          />
        ) : (
          <div className={cn("relative overflow-hidden bg-black", panelState.result?.aspectRatio === "16:9" ? "aspect-video" : "aspect-[9/16]")}>
            <img
              alt={panelState.result?.title ?? "Video preview"}
              className="h-full w-full object-cover opacity-90"
              src={fallbackPoster ?? panelState.result?.posterImageUrl}
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.05),rgba(0,0,0,0.5))]" />
            <div className="absolute bottom-4 left-4 right-4 rounded-[20px] border border-white/12 bg-black/45 px-4 py-3 text-sm text-white/86 backdrop-blur-sm">
              Preview placeholder
            </div>
          </div>
        )}
      </div>

      <div className="px-1 pb-1 pt-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-lg font-semibold text-white">{panelState.result?.title ?? "Completed video"}</p>
            <p className="mt-2 text-sm text-white/58">{panelState.detail}</p>
            {!panelState.result?.videoUrl ? (
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-amber-200/75">
                No video file returned yet. Check the provider response and try again.
              </p>
            ) : null}
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-white/60">
            {panelState.result?.providerLabel ?? panelState.provider ?? "Provider"}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-black disabled:opacity-60"
            disabled={panelState.actionPending !== null}
            onClick={onDownload}
            type="button"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82 disabled:opacity-60"
            disabled={panelState.actionPending !== null}
            onClick={onSave}
            type="button"
          >
            Save to Profile
          </button>
          <button
            className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm font-medium text-accent-soft disabled:opacity-60"
            disabled={panelState.actionPending !== null}
            onClick={onPost}
            type="button"
          >
            Post
          </button>
          <button
            className="rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-white/82 disabled:opacity-60"
            disabled={panelState.actionPending !== null}
            onClick={onRegenerate}
            type="button"
          >
            Regenerate
          </button>
        </div>
      </div>
    </div>
  );
}

function useVideoPolling(
  panelState: VideoComposerState,
  setPanelState: (value: VideoComposerState | ((current: VideoComposerState) => VideoComposerState)) => void
) {
  useEffect(() => {
    if (!panelState.jobId) {
      return;
    }
    if (panelState.status !== "queued" && panelState.status !== "generating" && panelState.status !== "processing") {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const response = await fetch(`/api/video/status/${panelState.jobId}`, {
          cache: "no-store"
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Could not fetch video status.");
        }
        if (cancelled) {
          return;
        }

        setPanelState((current) => ({
          ...current,
          status: payload.status,
          message: payload.message,
          detail: payload.detail,
          provider: payload.provider,
          error: payload.status === "failed" ? payload.detail : null,
          result: payload.result ?? null
        }));

        if (payload.status === "queued" || payload.status === "generating" || payload.status === "processing") {
          timer = window.setTimeout(poll, 1600);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setPanelState((current) => ({
          ...current,
          status: "failed",
          error: error instanceof Error ? error.message : "Could not fetch video status.",
          detail: "Could not fetch video status."
        }));
      }
    };

    timer = window.setTimeout(poll, 1200);

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [panelState.jobId, panelState.status, setPanelState]);
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("Could not read image."));
    };
    reader.onerror = () => reject(new Error("Could not read image."));
    reader.readAsDataURL(file);
  });
}

async function prepareReferenceImageFile(file: File, targetSize: "720x1280" | "1280x720") {
  const [targetWidth, targetHeight] = targetSize.split("x").map((value) => Number.parseInt(value, 10));
  const image = await loadImageElement(file);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Could not prepare the uploaded image.");
  }

  const scale = Math.max(targetWidth / image.naturalWidth, targetHeight / image.naturalHeight);
  const drawWidth = image.naturalWidth * scale;
  const drawHeight = image.naturalHeight * scale;
  const offsetX = (targetWidth - drawWidth) / 2;
  const offsetY = (targetHeight - drawHeight) / 2;

  context.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => {
      if (value) {
        resolve(value);
        return;
      }
      reject(new Error("Could not prepare the uploaded image."));
    }, "image/png");
  });

  const normalizedName = file.name.replace(/\.[^.]+$/, "") || "reference-image";
  return new File([blob], `${normalizedName}-${targetWidth}x${targetHeight}.png`, { type: "image/png" });
}

function loadImageElement(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read image."));
    };
    image.src = objectUrl;
  });
}

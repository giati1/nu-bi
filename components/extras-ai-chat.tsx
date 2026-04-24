"use client";

import { Bot, Mic, Send, Sparkles, Square, Volume2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  body: string;
};

type RecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: {
    results: ArrayLike<{
      0: { transcript: string };
      isFinal?: boolean;
    }>;
  }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

const starterPrompts = [
  "Help me write a better post",
  "Give me a reply idea",
  "Turn this into a caption"
] as const;

const voiceOptions = [
  { id: "marin", label: "Marin" },
  { id: "cedar", label: "Cedar" },
  { id: "coral", label: "Coral" },
  { id: "alloy", label: "Alloy" },
  { id: "verse", label: "Verse" },
  { id: "custom", label: "Custom" }
] as const;

export function ExtrasAIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "assistant",
      body: "I'm NU-BI AI. Ask for captions, replies, post ideas, or quick feedback."
    }
  ]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [speakReplies, setSpeakReplies] = useState(true);
  const [voice, setVoice] = useState<(typeof voiceOptions)[number]["id"]>("marin");
  const [customVoiceId, setCustomVoiceId] = useState("");
  const [recording, setRecording] = useState(false);
  const [pending, startTransition] = useTransition();
  const recognitionRef = useRef<RecognitionLike | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const recognitionSupported = useMemo(() => {
    if (typeof window === "undefined") {
      return false;
    }

    return Boolean(
      (window as Window & { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike }).webkitSpeechRecognition
    );
  }, []);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <section className="panel-soft edge-light overflow-hidden rounded-[28px] p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.24em] text-accent-soft">NU-BI AI</p>
          <p className="mt-2 text-base font-semibold text-white">Chat with voice</p>
          <p className="mt-2 text-sm text-white/60">
            Ask for captions, replies, post ideas, or feedback. You can type or talk.
          </p>
        </div>
        <button
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-medium uppercase tracking-[0.14em] ${
            speakReplies ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/70"
          }`}
          onClick={() => setSpeakReplies((current) => !current)}
          type="button"
        >
          <Volume2 className="h-3.5 w-3.5" />
          {speakReplies ? "Voice on" : "Voice off"}
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {starterPrompts.map((prompt) => (
          <button
            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/76"
            key={prompt}
            onClick={() => setInput(prompt)}
            type="button"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap items-center gap-2">
          {voiceOptions.map((option) => (
            <button
              className={`rounded-full border px-3 py-2 text-xs ${
                voice === option.id ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/72"
              }`}
              key={option.id}
              onClick={() => setVoice(option.id)}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
        {voice === "custom" ? (
          <input
            className="mt-3 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-accent"
            onChange={(event) => setCustomVoiceId(event.target.value)}
            placeholder="Custom voice ID"
            value={customVoiceId}
          />
        ) : null}
        <p className="mt-3 text-xs text-white/46">Replies use your configured AI voice.</p>
      </div>

      <div className="mt-4 space-y-3 rounded-[24px] border border-white/10 bg-black/25 p-3">
        {messages.map((message) => (
          <div
            className={`rounded-[22px] px-4 py-3 text-sm leading-6 ${
              message.role === "assistant"
                ? "mr-8 border border-white/10 bg-white/[0.04] text-white/84"
                : "ml-8 bg-white text-black"
            }`}
            key={message.id}
          >
            <div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] opacity-65">
              {message.role === "assistant" ? <Bot className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
              {message.role === "assistant" ? "NU-BI AI" : "You"}
            </div>
            <p className="whitespace-pre-wrap">{message.body}</p>
          </div>
        ))}
        {pending ? (
          <div className="mr-8 rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/68">
            NU-BI AI is thinking...
          </div>
        ) : null}
      </div>

      <div className="mt-4 rounded-[24px] border border-white/10 bg-white/[0.03] p-3">
        <textarea
          className="min-h-28 w-full rounded-[20px] border border-white/10 bg-black/40 px-4 py-3 text-white outline-none focus:border-accent"
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask for help with a post, a reply, or an idea..."
          value={input}
        />
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={`inline-flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm ${
                recording ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/76"
              }`}
              disabled={!recognitionSupported}
              onClick={() => {
                if (recording) {
                  recognitionRef.current?.stop();
                  setRecording(false);
                  return;
                }
                startVoiceInput();
              }}
              type="button"
            >
              {recording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {recording ? "Stop mic" : recognitionSupported ? "Use voice" : "Voice unavailable"}
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/76"
              onClick={() => {
                setMessages([
                  {
                    id: crypto.randomUUID(),
                    role: "assistant",
                    body: "I'm NU-BI AI. Ask for captions, replies, post ideas, or quick feedback."
                  }
                ]);
                setInput("");
                setError(null);
              }}
              type="button"
            >
              Clear chat
            </button>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-medium text-black disabled:opacity-60"
            disabled={pending || !input.trim()}
            onClick={() => sendMessage(input)}
            type="button"
          >
            <Send className="h-4 w-4" />
            Send
          </button>
        </div>
      </div>
      {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
      {!recognitionSupported ? (
        <p className="mt-3 text-xs text-white/46">Voice input depends on browser speech recognition support.</p>
      ) : null}
    </section>
  );

  function startVoiceInput() {
    setError(null);

    const RecognitionCtor =
      (window as Window & { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike }).SpeechRecognition ||
      (window as Window & { SpeechRecognition?: new () => RecognitionLike; webkitSpeechRecognition?: new () => RecognitionLike }).webkitSpeechRecognition;

    if (!RecognitionCtor) {
      setError("Voice input is not available in this browser.");
      return;
    }

    const recognition = new RecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .trim();
      setInput(transcript);
    };
    recognition.onerror = () => {
      setRecording(false);
      setError("Voice input was blocked or interrupted.");
    };
    recognition.onend = () => {
      setRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setRecording(true);
  }

  function sendMessage(rawInput: string) {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      body: trimmed
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);

    startTransition(async () => {
      const transcript = nextMessages
        .slice(-6)
        .map((message) => `${message.role === "assistant" ? "Assistant" : "User"}: ${message.body}`)
        .join("\n");

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: transcript,
          mood: "warm"
        })
      });

      const payload = await response.json();
      if (!response.ok) {
        setError(payload.error ?? "Chat failed.");
        return;
      }

      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        body: payload.reply
      };

      setMessages((current) => [...current, assistantMessage]);

      if (speakReplies) {
        try {
          const speechResponse = await fetch("/api/ai/speech", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              input: payload.reply,
              voice,
              customVoiceId: voice === "custom" ? customVoiceId : null,
              instructions: "Speak naturally, clearly, and like a polished assistant in a social app."
            })
          });

          if (!speechResponse.ok) {
            const speechPayload = await speechResponse.json().catch(() => null);
            setError(speechPayload?.error ?? "Voice playback failed.");
            return;
          }

          const audioBlob = await speechResponse.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          audioRef.current?.pause();
          if (audioRef.current?.src?.startsWith("blob:")) {
            URL.revokeObjectURL(audioRef.current.src);
          }
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          audio.play().catch(() => {
            setError("Tap again if your browser blocked audio autoplay.");
          });
        } catch {
          setError("Voice playback failed.");
        }
      }
    });
  }
}

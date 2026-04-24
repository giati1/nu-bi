"use client";

import Image from "next/image";
import { FileText, ImageIcon, MessageSquareText } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { AIChatPanel } from "@/components/ai-chat-panel";

const moods = [
  { id: "focused", label: "Focused" },
  { id: "warm", label: "Warm" },
  { id: "playful", label: "Playful" },
  { id: "bold", label: "Bold" }
] as const;

const tabs = [
  { id: "chat", label: "Chat", Icon: MessageSquareText },
  { id: "images", label: "Images", Icon: ImageIcon },
  { id: "docs", label: "Docs", Icon: FileText }
] as const;

type StudioTab = (typeof tabs)[number]["id"];

export function AIStudio() {
  const [activeTab, setActiveTab] = useState<StudioTab>("chat");
  const [mood, setMood] = useState<(typeof moods)[number]["id"]>("focused");
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageStyle, setImageStyle] = useState("editorial");
  const [imageOutput, setImageOutput] = useState<{ url: string; prompt: string } | null>(null);
  const [docPrompt, setDocPrompt] = useState("Read this document and summarize the important details.");
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docText, setDocText] = useState("");
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);
  const [docOutput, setDocOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedDocLabel = useMemo(() => {
    if (!docFile) {
      return "No document selected";
    }
    return `${docFile.name} · ${formatFileSize(docFile.size)}`;
  }, [docFile]);

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[30px] p-5 shadow-panel">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">AI workspace</p>
            <p className="mt-3 text-sm text-white/68">
              One place for voice chat, image generation, and document reading.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {moods.map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition ${
                  mood === item.id ? "bg-white text-black" : "border border-white/10 bg-white/[0.03] text-white/72 hover:bg-white/[0.06]"
                }`}
                key={item.id}
                onClick={() => setMood(item.id)}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {tabs.map(({ id, label, Icon }) => (
            <button
              className={`flex items-center justify-center gap-2 rounded-[20px] border px-4 py-3 text-sm font-semibold transition ${
                activeTab === id
                  ? "border-accent bg-white text-black"
                  : "border-white/10 bg-black/25 text-white/76 hover:border-white/20 hover:bg-white/[0.04]"
              }`}
              key={id}
              onClick={() => setActiveTab(id)}
              type="button"
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "chat" ? <AIChatPanel /> : null}

      {activeTab === "images" ? (
        <section className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Image Generator</p>
              <p className="mt-2 text-sm text-white/62">Describe the look you want and NU-BI AI will build a visual from it.</p>
            </div>
            <button
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const response = await fetch("/api/ai/visual", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: imagePrompt, style: imageStyle, mood })
                  });
                  const payload = await response.json();
                  if (!response.ok) {
                    setError(payload.error ?? "Image generation failed.");
                    return;
                  }
                  setImageOutput(payload);
                })
              }
              type="button"
            >
              {pending ? "Working..." : "Generate image"}
            </button>
          </div>
          <textarea
            className="mt-4 min-h-28 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
            onChange={(event) => setImagePrompt(event.target.value)}
            placeholder="Describe a campaign visual, mood board, product drop, portrait, or post background..."
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
        </section>
      ) : null}

      {activeTab === "docs" ? (
        <section className="glass-panel rounded-[30px] p-5 shadow-panel">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-lg font-semibold">Document Scan and Reader</p>
              <p className="mt-2 text-sm text-white/62">
                Upload a photo of a page, note, receipt, or a text file and NU-BI AI will read it for you.
              </p>
            </div>
            <button
              className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white"
              disabled={pending || (!docFile && !docText.trim())}
              onClick={() =>
                startTransition(async () => {
                  setError(null);

                  let imageDataUrl: string | null = null;
                  if (docFile?.type.startsWith("image/")) {
                    imageDataUrl = await readFileAsDataUrl(docFile);
                  }

                  const response = await fetch("/api/ai/document", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      task: docPrompt,
                      text: docText.trim() || null,
                      imageDataUrl
                    })
                  });
                  const payload = await response.json();
                  if (!response.ok) {
                    setError(payload.error ?? "Document reading failed.");
                    return;
                  }
                  setDocOutput(payload.result);
                })
              }
              type="button"
            >
              {pending ? "Reading..." : "Read document"}
            </button>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-black/20 p-4">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/82">
              <input
                accept="image/*,.txt,.md,.json,.csv"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0] ?? null;
                  setError(null);
                  setDocOutput("");
                  setDocFile(file);
                  setDocText("");
                  if (docPreviewUrl) {
                    URL.revokeObjectURL(docPreviewUrl);
                    setDocPreviewUrl(null);
                  }

                  if (!file) {
                    return;
                  }

                  if (file.type.startsWith("image/")) {
                    setDocPreviewUrl(URL.createObjectURL(file));
                    return;
                  }

                  if (isReadableTextType(file)) {
                    setDocText(await file.text());
                    return;
                  }

                  setDocFile(null);
                  setError("Use an image of a document or a text file.");
                }}
                type="file"
              />
              Choose document
            </label>
            <p className="mt-3 text-sm text-white/62">{selectedDocLabel}</p>
            <textarea
              className="mt-4 min-h-24 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 outline-none focus:border-accent"
              onChange={(event) => setDocPrompt(event.target.value)}
              placeholder="What should NU-BI AI do with this document?"
              value={docPrompt}
            />

            {docPreviewUrl ? (
              <div className="mt-4 overflow-hidden rounded-[24px] border border-white/10 bg-black/30 p-3">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[18px]">
                  <Image alt="Selected document" className="object-contain" fill sizes="560px" src={docPreviewUrl} unoptimized />
                </div>
              </div>
            ) : null}

            {docText ? (
              <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">Detected text</p>
                <p className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap text-sm text-white/78">{docText}</p>
              </div>
            ) : null}

            {docOutput ? (
              <div className="mt-4 rounded-[24px] border border-accent/20 bg-accent/5 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">Reading result</p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/85">{docOutput}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
    </div>
  );
}

function isReadableTextType(file: File) {
  if (file.type.startsWith("text/")) {
    return true;
  }

  return [".txt", ".md", ".json", ".csv"].some((extension) => file.name.toLowerCase().endsWith(extension));
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

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

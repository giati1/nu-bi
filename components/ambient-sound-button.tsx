"use client";

import { useRef, useState } from "react";

export function AmbientSoundButton({ compact = false }: { compact?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);

  async function toggleSound() {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (playing) {
      audio.pause();
      setPlaying(false);
      return;
    }

    try {
      audio.volume = 0.45;
      await audio.play();
      setPlaying(true);
    } catch {
      setPlaying(false);
    }
  }

  return (
    <>
      <audio ref={audioRef} src="/cinematic/pulse-sound.mp3" loop preload="none" />
      <button
        type="button"
        onClick={() => void toggleSound()}
        aria-pressed={playing}
        title={playing ? "Mute site sound" : "Play site ambient sound"}
        className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.2em] transition ${
          playing
            ? "border-rose-500/60 bg-rose-500/20 text-white shadow-[0_0_24px_rgba(244,63,94,0.35)]"
            : "border-white/15 bg-black/55 text-white/80 hover:border-white/35 hover:bg-white/10 hover:text-white"
        } ${compact ? "px-3 py-1.5 text-[10px]" : ""}`}
      >
        <span className="flex items-end gap-0.5 h-3" aria-hidden="true">
          <span
            className={`w-0.5 rounded-full bg-current transition-all ${
              playing ? "h-3 animate-pulse" : "h-1.5 opacity-60"
            }`}
          />
          <span
            className={`w-0.5 rounded-full bg-current transition-all ${
              playing ? "h-2 animate-pulse" : "h-2.5 opacity-60"
            }`}
          />
          <span
            className={`w-0.5 rounded-full bg-current transition-all ${
              playing ? "h-3.5 animate-pulse" : "h-1 opacity-60"
            }`}
          />
        </span>
        <span>{playing ? "Sound On" : "Sound"}</span>
      </button>
    </>
  );
}

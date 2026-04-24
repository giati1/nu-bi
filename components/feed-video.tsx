"use client";

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useRef, useState } from "react";

export function FeedVideo({
  src,
  poster
}: {
  src: string;
  poster?: string;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [muted, setMuted] = useState(true);
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        className="h-full w-full object-cover"
        controls
        loop
        muted={muted}
        onPause={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        playsInline
        poster={poster}
        preload="metadata"
        ref={videoRef}
        src={src}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="absolute bottom-3 right-3 flex items-center gap-2">
        <button
          className="rounded-full border border-white/10 bg-black/55 p-2 text-white"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            const video = videoRef.current;
            if (!video) {
              return;
            }

            if (video.paused) {
              void video.play().catch(() => undefined);
            } else {
              video.pause();
            }
          }}
          type="button"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          className="rounded-full border border-white/10 bg-black/55 p-2 text-white"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();

            const nextMuted = !muted;
            setMuted(nextMuted);
            if (videoRef.current) {
              videoRef.current.muted = nextMuted;
            }
          }}
          type="button"
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}

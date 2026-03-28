"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const ACTIVE_VIDEO_EVENT = "nubi:active-feed-video";

export function FeedVideo({
  src,
  poster,
  autoPlayOnView = true
}: {
  src: string;
  poster?: string;
  autoPlayOnView?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const id = useId();
  const [muted, setMuted] = useState(true);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlayOnView) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry?.isIntersecting && entry.intersectionRatio >= 0.65);
      },
      { threshold: [0.2, 0.4, 0.65, 0.9] }
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [autoPlayOnView]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !autoPlayOnView) {
      return;
    }

    if (inView) {
      window.dispatchEvent(new CustomEvent(ACTIVE_VIDEO_EVENT, { detail: { id } }));
      void video.play().catch(() => undefined);
      return;
    }

    video.pause();
  }, [autoPlayOnView, id, inView]);

  useEffect(() => {
    const handleOtherVideoActive = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      if (customEvent.detail?.id === id) {
        return;
      }
      videoRef.current?.pause();
    };

    window.addEventListener(ACTIVE_VIDEO_EVENT, handleOtherVideoActive as EventListener);
    return () => {
      window.removeEventListener(ACTIVE_VIDEO_EVENT, handleOtherVideoActive as EventListener);
    };
  }, [id]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = muted;
    }
  }, [muted]);

  return (
    <div className="relative h-full w-full bg-black">
      <video
        className="h-full w-full object-cover"
        controls
        loop
        muted={muted}
        playsInline
        poster={poster}
        preload="metadata"
        ref={videoRef}
        src={src}
      />
      <button
        className="absolute bottom-3 right-3 rounded-full border border-white/10 bg-black/55 p-2 text-white"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setMuted((current) => !current);
        }}
        type="button"
      >
        {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
    </div>
  );
}

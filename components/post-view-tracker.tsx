"use client";

import { useEffect, useRef } from "react";

export function PostViewTracker({
  postId,
  context,
  onRecorded
}: {
  postId: string;
  context: string;
  onRecorded?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasTrackedRef = useRef(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || hasTrackedRef.current) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || entry.intersectionRatio < 0.65 || hasTrackedRef.current) {
          return;
        }

        hasTrackedRef.current = true;
        observer.disconnect();

        void fetch("/api/posts/view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId, context })
        })
          .then(async (response) => {
            if (!response.ok) {
              return null;
            }
            return (await response.json()) as { recorded?: boolean };
          })
          .then((result) => {
            if (result?.recorded) {
              onRecorded?.();
            }
          })
          .catch(() => undefined);
      },
      { threshold: [0.35, 0.5, 0.65, 0.85] }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [context, onRecorded, postId]);

  return <div aria-hidden className="pointer-events-none absolute inset-0" ref={containerRef} />;
}

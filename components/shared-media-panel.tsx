"use client";

import Image from "next/image";
import { useState } from "react";
import type { MessageRecord } from "@/types/domain";

export function SharedMediaPanel({ thread }: { thread: MessageRecord[] }) {
  const [failedMediaIds, setFailedMediaIds] = useState<string[]>([]);
  const media = thread.flatMap((message) =>
    message.media.map((item) => ({
      ...item,
      messageId: message.id
    }))
  );

  if (media.length === 0) {
    return (
      <section className="glass-panel rounded-[24px] p-4 text-sm text-white/60">
        No shared media in this conversation yet.
      </section>
    );
  }

  function markMediaFailed(mediaId: string) {
    setFailedMediaIds((current) => (current.includes(mediaId) ? current : [...current, mediaId]));
  }

  return (
    <section className="glass-panel rounded-[24px] p-4">
      <p className="text-sm uppercase tracking-[0.18em] text-accent-soft">Shared media</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {media.map((item) => (
          <div className="relative aspect-square overflow-hidden rounded-[18px] bg-black" key={item.id}>
            {item.mimeType?.startsWith("video/") ? (
              <video className="h-full w-full object-cover" muted playsInline preload="metadata" src={item.url} />
            ) : item.mimeType?.startsWith("audio/") ? (
              <div className="flex h-full items-center justify-center bg-white/5 px-3 text-center text-xs text-white/70">
                Voice note
              </div>
            ) : failedMediaIds.includes(item.id) ? (
              <div className="flex h-full items-center justify-center bg-white/[0.03] px-3 text-center text-[11px] uppercase tracking-[0.16em] text-white/45">
                Media unavailable
              </div>
            ) : (
              <Image
                alt="Shared media"
                className="object-cover"
                fill
                onError={() => markMediaFailed(item.id)}
                sizes="160px"
                src={item.url}
                unoptimized
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

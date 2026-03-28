"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Heart, MessageCircle, Play, Repeat2 } from "lucide-react";
import type { FeedPost } from "@/types/domain";

export function ShortsFeed({ posts }: { posts: FeedPost[] }) {
  const refs = useRef<Record<string, HTMLVideoElement | null>>({});
  const [activePostId, setActivePostId] = useState(posts[0]?.id ?? null);
  const tracked = useRef(new Set<string>());

  const videoPosts = useMemo(
    () =>
      posts
        .map((post) => ({
          post,
          video: post.media.find((item) => item.mimeType?.startsWith("video/")) ?? null
        }))
        .filter((item) => item.video),
    [posts]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (!visible) {
          return;
        }

        const postId = visible.target.getAttribute("data-post-id");
        if (!postId) {
          return;
        }

        setActivePostId(postId);
        for (const item of videoPosts) {
          const video = refs.current[item.post.id];
          if (!video) {
            continue;
          }
          if (item.post.id === postId) {
            void video.play().catch(() => undefined);
          } else {
            video.pause();
          }
        }

        if (!tracked.current.has(postId)) {
          tracked.current.add(postId);
          void fetch("/api/shorts/view", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ postId, context: "shorts" })
          });
        }
      },
      { threshold: [0.6, 0.8, 1] }
    );

    const elements = document.querySelectorAll("[data-post-id]");
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [videoPosts]);

  return (
    <div className="space-y-5">
      <section className="glass-panel rounded-[28px] border-accent/15 bg-accent/5 p-5">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Shorts mode</p>
        <p className="mt-3 text-sm text-white/65">
          Scroll one card at a time. The active short auto-plays, and views are tracked once per session window.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-white/40">
          Swipe up for the next short
        </p>
      </section>
      <div className="max-h-[calc(100vh-12rem)] snap-y snap-mandatory space-y-5 overflow-y-auto pr-1">
        {videoPosts.map(({ post, video }) => (
          <article
            className={`glass-panel snap-start overflow-hidden rounded-[32px] shadow-panel transition duration-300 ${
              activePostId === post.id ? "scale-[1.01] border border-accent/20" : "scale-[0.985] opacity-85"
            }`}
            data-post-id={post.id}
            key={post.id}
          >
            <div className="relative aspect-[9/16] bg-black">
              <video
                className="h-full w-full object-cover"
                controls
                loop
                muted
                playsInline
                preload="metadata"
                ref={(node) => {
                  refs.current[post.id] = node;
                }}
                src={video?.url}
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5">
                <div className="flex items-end justify-between gap-4">
                  <div className="max-w-[75%]">
                    <p className="text-lg font-semibold">{post.author.displayName}</p>
                    <p className="mt-1 text-sm text-white/55">@{post.author.username}</p>
                    {post.body ? <p className="mt-3 text-sm text-white/80">{post.body}</p> : null}
                  </div>
                  <div className="space-y-3 rounded-[24px] border border-white/10 bg-black/40 p-3 text-xs text-white/70">
                    <Stat icon={<Play className="h-4 w-4" />} value={post.viewCount} />
                    <Stat icon={<Heart className="h-4 w-4" />} value={post.likeCount} />
                    <Stat icon={<MessageCircle className="h-4 w-4" />} value={post.commentCount} />
                    <Stat icon={<Repeat2 className="h-4 w-4" />} value={post.repostCount} />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between px-5 py-4 text-xs uppercase tracking-[0.16em] text-white/45">
              <span>{activePostId === post.id ? "Active short" : "Queued short"}</span>
              <span>{video?.mimeType?.replace("video/", "").toUpperCase()}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ icon, value }: { icon: ReactNode; value: number }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <span>{value}</span>
    </div>
  );
}

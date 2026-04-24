"use client";

import Link from "next/link";
import { Grid2x2, ImageIcon, LayoutList, Play, Video } from "lucide-react";
import { useMemo, useState } from "react";
import { PinPostButton } from "@/components/pin-post-button";
import { PostCard } from "@/components/post-card";
import { cn } from "@/lib/utils";
import type { FeedPost } from "@/types/domain";

export function ProfilePostsView({
  posts,
  viewerId,
  isSelf,
  pinnedPostId,
  canViewContent,
  canDeleteAnyPost = false
}: {
  posts: FeedPost[];
  viewerId: string;
  isSelf: boolean;
  pinnedPostId?: string | null;
  canViewContent: boolean;
  canDeleteAnyPost?: boolean;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [mediaFilter, setMediaFilter] = useState<"all" | "photos" | "videos">("all");

  const mediaPosts = useMemo(
    () => posts.filter((post) => post.media.length > 0),
    [posts]
  );
  const filteredMediaPosts = useMemo(() => {
    if (mediaFilter === "all") {
      return mediaPosts;
    }
    return mediaPosts.filter((post) =>
      post.media.some((media) =>
        mediaFilter === "videos" ? Boolean(media.mimeType?.startsWith("video/")) : !media.mimeType?.startsWith("video/")
      )
    );
  }, [mediaFilter, mediaPosts]);

  return (
    <section className="space-y-4">
      {!canViewContent ? null : (
        <>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm uppercase tracking-[0.22em] text-accent-soft">Posts</p>
        <div className="flex flex-wrap gap-2">
          {[
            { key: "grid", label: "Grid", Icon: Grid2x2 },
            { key: "list", label: "List", Icon: LayoutList }
          ].map(({ key, label, Icon }) => (
            <button
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em]",
                view === key ? "border-accent bg-accent/15 text-accent-soft" : "border-white/10 text-white/60"
              )}
              key={key}
              onClick={() => setView(key as "grid" | "list")}
              type="button"
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          {view === "grid"
            ? [
                { key: "all", label: "All", Icon: Grid2x2 },
                { key: "photos", label: "Photos", Icon: ImageIcon },
                { key: "videos", label: "Videos", Icon: Video }
              ].map(({ key, label, Icon }) => (
                <button
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs uppercase tracking-[0.14em]",
                    mediaFilter === key ? "border-white bg-white text-black" : "border-white/10 text-white/60"
                  )}
                  key={key}
                  onClick={() => setMediaFilter(key as "all" | "photos" | "videos")}
                  type="button"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))
            : null}
        </div>
      </div>

      {view === "grid" ? (
        filteredMediaPosts.length === 0 ? (
          <div className="glass-panel rounded-[28px] p-6 text-sm text-white/60">
            No matching media posts yet. Switch filters or use list view to see text posts.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {filteredMediaPosts.map((post) => {
              const firstMedia = post.media[0];
              const video = Boolean(firstMedia?.mimeType?.startsWith("video/"));
              return (
                <Link
                  className="group relative aspect-square overflow-hidden rounded-[26px] border border-white/10 bg-black lg:aspect-[1/1.08]"
                  href={`/post/${post.id}`}
                  key={post.id}
                >
                  {video ? (
                    <video className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" muted playsInline preload="metadata" src={firstMedia.url} />
                  ) : (
                    <img alt="Profile media" className="media-image-focus h-full w-full transition duration-300 group-hover:scale-[1.03]" src={firstMedia?.url} />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                  {video ? (
                    <div className="absolute right-3 top-3 rounded-full bg-black/55 p-2 text-white">
                      <Play className="h-3.5 w-3.5" />
                    </div>
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <p className="line-clamp-2 text-sm text-white/90">{post.body || "Media post"}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-white/55">
                      {post.viewCount} views
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )
      ) : (
        <div className="space-y-5">
          {posts.map((post) => (
            <div className="space-y-3" key={post.id}>
              <PostCard
                allowDelete={canDeleteAnyPost || post.author.id === viewerId}
                allowEngagementOverride={canDeleteAnyPost}
                post={post}
                viewerId={viewerId}
              />
              {isSelf ? <PinPostButton pinned={pinnedPostId === post.id} postId={post.id} /> : null}
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </section>
  );
}

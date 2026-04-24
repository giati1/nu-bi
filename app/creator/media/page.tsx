import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { EmptyState } from "@/components/empty-state";
import { requirePageViewer } from "@/lib/auth/session";
import { getCreatorDashboard } from "@/lib/db/repository";

export default async function CreatorMediaPage() {
  const viewer = await requirePageViewer("/creator/media");

  const dashboard = await getCreatorDashboard(viewer.id);
  const posts = [...dashboard.published, ...dashboard.scheduled, ...dashboard.drafts];
  const mediaPosts = posts.filter((post) => post.media.length > 0);

  return (
    <AppShell
      title="Media Library"
      subtitle="Review every uploaded image and short-form video connected to your posts."
    >
      <div className="flex flex-wrap gap-3">
        <Link className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-white/75" href="/creator">
          Back to create post
        </Link>
        <Link className="rounded-2xl bg-accent px-4 py-3 text-sm font-medium text-white" href="/creator#post-composer">
          Open post composer
        </Link>
      </div>
      {mediaPosts.length === 0 ? (
        <EmptyState
          title="No uploaded media yet"
          description="Upload an image or a short video from the composer and it will appear here."
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {mediaPosts.flatMap((post) =>
            post.media.map((media) => (
              <article className="glass-panel overflow-hidden rounded-[28px] shadow-panel" key={`${post.id}-${media.id}`}>
                <div className="relative aspect-square bg-black">
                  {media.mimeType?.startsWith("video/") ? (
                    <video className="h-full w-full object-cover" controls muted playsInline preload="metadata" src={media.url} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt="Library media" className="media-image-focus h-full w-full" src={media.url} />
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-accent-soft">
                    {media.mimeType?.startsWith("video/") ? "Video" : "Image"}
                  </p>
                  <p className="line-clamp-3 text-sm text-white/75">{post.body || "Media-only post"}</p>
                  <Link className="inline-flex text-sm text-accent-soft underline underline-offset-4" href={`/post/${post.id}`}>
                    Open post
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </AppShell>
  );
}

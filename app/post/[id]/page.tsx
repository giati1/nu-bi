import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { CommentComposer } from "@/components/comment-composer";
import { PostCard } from "@/components/post-card";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { getViewer } from "@/lib/auth/session";
import { env } from "@/lib/config/env";
import { getCommentsForPost, getPostById } from "@/lib/db/repository";

export async function generateMetadata({
  params
}: {
  params: { id: string };
}): Promise<Metadata> {
  const post = await getPostById(params.id, "");
  if (!post) {
    return {
      title: "Post not found | NU-BI",
      description: "This post could not be found on NU-BI."
    };
  }

  const authorTitle = `${post.author.displayName} (@${post.author.username}) on NU-BI`;
  const rawBody = post.body?.trim() || `View ${post.author.displayName}'s post on NU-BI.`;
  const snippet = rawBody.length > 200 ? `${rawBody.slice(0, 197)}...` : rawBody;
  const postUrl = `${env.appUrl.replace(/\/$/, "")}/post/${post.id}`;

  const firstMedia = post.media[0] ?? null;
  const isVideo = Boolean(
    firstMedia &&
      (firstMedia.mimeType?.startsWith("video/") || /\.(mp4|webm|mov)(\?|$)/i.test(firstMedia.url))
  );

  const resolveAbsoluteUrl = (url: string | null | undefined) => {
    if (!url) {
      return undefined;
    }
    if (/^https?:\/\//i.test(url)) {
      return url;
    }
    return `${env.appUrl.replace(/\/$/, "")}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const mediaUrl = resolveAbsoluteUrl(firstMedia?.url);
  const avatarUrl = resolveAbsoluteUrl(post.author.avatarUrl);
  const ogImageUrl = (!isVideo && mediaUrl) ? mediaUrl : avatarUrl;

  return {
    title: authorTitle,
    description: snippet,
    openGraph: {
      title: authorTitle,
      description: snippet,
      url: postUrl,
      siteName: "NU-BI",
      type: isVideo ? "video.other" : "article",
      ...(ogImageUrl
        ? {
            images: [
              {
                url: ogImageUrl,
                alt: `${post.author.displayName} on NU-BI`
              }
            ]
          }
        : {}),
      ...(isVideo && mediaUrl
        ? {
            videos: [
              {
                url: mediaUrl,
                type: firstMedia?.mimeType ?? "video/mp4"
              }
            ]
          }
        : {})
    },
    twitter: {
      card: ogImageUrl ? "summary_large_image" : "summary",
      title: authorTitle,
      description: snippet,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {})
    }
  };
}

export default async function PostDetailPage({
  params
}: {
  params: { id: string };
}) {
  const viewer = await getViewer();
  const [post, comments] = await Promise.all([
    getPostById(params.id, viewer?.id ?? ""),
    getCommentsForPost(params.id)
  ]);

  if (!post) {
    notFound();
  }

  const canDeleteAnyPost = viewer ? isInternalAdminUsername(viewer.username) : false;

  return (
    <AppShell
      subtitle="Post detail with media, comments, and public profile routing."
      title="Post detail"
    >
      <PostCard
        allowDelete={canDeleteAnyPost || (Boolean(viewer) && post.author.id === viewer?.id)}
        allowEngagementOverride={canDeleteAnyPost}
        post={post}
        viewerId={viewer?.id ?? ""}
      />
      <CommentComposer postId={post.id} />
      <section className="space-y-4">
        {comments.map((comment) => (
          <article
            className="glass-panel rounded-[28px] p-5"
            key={comment.id}
            style={{ marginLeft: `${comment.depth * 18}px` }}
          >
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11" name={comment.author.displayName} src={comment.author.avatarUrl} />
              <div>
                <p className="font-medium">{comment.author.displayName}</p>
                <p className="text-sm text-white/50">@{comment.author.username}</p>
              </div>
            </div>
            {comment.depth > 0 ? (
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/40">
                Reply
              </p>
            ) : null}
            {comment.body ? <p className="mt-4 whitespace-pre-wrap text-white/80">{comment.body}</p> : null}
            {comment.media.length > 0 ? (
              <div className="mt-4 space-y-3">
                {comment.media.map((media) => (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4" key={media.id}>
                    <p className="mb-3 text-[11px] uppercase tracking-[0.16em] text-white/45">
                      {media.mimeType?.startsWith("audio/") ? "Voice comment" : "Attachment"}
                    </p>
                    {media.mimeType?.startsWith("audio/") ? (
                      <audio className="w-full" controls preload="metadata" src={media.url} />
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </AppShell>
  );
}

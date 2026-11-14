import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PostCard } from "@/components/post-card";
import { PostThreadComments } from "@/components/post-thread-comments";
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
      <PostThreadComments comments={comments} postId={post.id} />
    </AppShell>
  );
}

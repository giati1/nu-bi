import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { CommentComposer } from "@/components/comment-composer";
import { PostCard } from "@/components/post-card";
import { isInternalAdminUsername } from "@/lib/auth/internal";
import { getViewer } from "@/lib/auth/session";
import { getCommentsForPost, getPostById } from "@/lib/db/repository";

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
        allowDelete={canDeleteAnyPost || post.author.id === viewer?.id}
        allowEngagementOverride={canDeleteAnyPost}
        post={post}
        viewerId={viewer?.id ?? ""}
      />
      {viewer ? (
        <CommentComposer postId={post.id} />
      ) : (
        <section className="glass-panel rounded-[24px] p-4 text-sm text-white/70">
          <Link className="text-accent-soft" href="/login">
            Log in
          </Link>{" "}
          to like, comment, or message this creator.
        </section>
      )}
      <section className="space-y-4">
        {comments.map((comment) => (
          <article className="glass-panel rounded-[28px] p-5" key={comment.id}>
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11" name={comment.author.displayName} src={comment.author.avatarUrl} />
              <div>
                <p className="font-medium">{comment.author.displayName}</p>
                <p className="text-sm text-white/50">@{comment.author.username}</p>
              </div>
            </div>
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

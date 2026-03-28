import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Avatar } from "@/components/avatar";
import { CommentComposer } from "@/components/comment-composer";
import { PostCard } from "@/components/post-card";
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

  return (
    <AppShell
      subtitle="Post detail with media, comments, and public profile routing."
      title="Post detail"
    >
      <PostCard allowDelete={post.author.id === viewer?.id} post={post} viewerId={viewer?.id ?? ""} />
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
            <p className="mt-4 whitespace-pre-wrap text-white/80">{comment.body}</p>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

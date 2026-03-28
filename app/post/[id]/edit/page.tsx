import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PostEditor } from "@/components/post-editor";
import { getViewer } from "@/lib/auth/session";
import { getOwnedEditablePost } from "@/lib/db/repository";

export default async function EditPostPage({
  params
}: {
  params: { id: string };
}) {
  const viewer = await getViewer();
  if (!viewer) {
    redirect(`/login?next=/post/${params.id}/edit`);
  }

  const post = await getOwnedEditablePost(params.id, viewer.id);
  if (!post) {
    notFound();
  }

  return (
    <AppShell
      subtitle="Adjust the caption, draft state, or schedule without recreating the post."
      title="Edit post"
    >
      <PostEditor
        post={{
          id: post.id,
          body: post.body,
          status: post.status ?? "published",
          scheduledFor: post.scheduledFor
        }}
      />
    </AppShell>
  );
}

import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { createPost, deletePost } from "@/lib/db/repository";
import { postSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = postSchema.parse(await request.json());
    const post = await createPost({
      userId: viewer.id,
      body: parsed.body.trim(),
      contentType: parsed.contentType,
      status: parsed.status,
      scheduledFor: parsed.status === "scheduled" ? parsed.scheduledFor ?? null : null,
      repostOfPostId: parsed.repostOfPostId ?? null,
      media: parsed.media,
      pollOptions: parsed.pollOptions
    });
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create post." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const viewer = await requireViewer();
    const { postId } = (await request.json()) as { postId?: string };
    if (!postId) {
      return NextResponse.json({ error: "Missing post id." }, { status: 400 });
    }
    await deletePost(postId, viewer.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete post." },
      { status: 400 }
    );
  }
}

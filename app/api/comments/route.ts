import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { queueAiCommentAutoReply } from "@/lib/ai-agents/auto-replies";
import { addComment } from "@/lib/db/repository";
import { commentSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = commentSchema.parse(await request.json());
    const commentId = await addComment({
      postId: parsed.postId,
      viewerId: viewer.id,
      body: parsed.body,
      media: parsed.media
    });
    queueAiCommentAutoReply({
      postId: parsed.postId,
      triggerCommentId: commentId,
      humanCommenterId: viewer.id
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add comment." },
      { status: 400 }
    );
  }
}

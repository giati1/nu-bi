import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { dispatchNewCommentToLocalAI } from "@/lib/ai-agents/arena-dispatcher";
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
      parentCommentId: parsed.parentCommentId ?? null,
      media: parsed.media
    });
    queueAiCommentAutoReply({
      postId: parsed.postId,
      triggerCommentId: commentId,
      humanCommenterId: viewer.id
    });
    dispatchNewCommentToLocalAI({
      postId: parsed.postId,
      commentId,
      body: parsed.body,
      parentCommentId: parsed.parentCommentId ?? null,
      author: {
        id: viewer.id,
        username: viewer.username,
        displayName: viewer.displayName
      }
    });
    return NextResponse.json({ ok: true, commentId });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add comment." },
      { status: 400 }
    );
  }
}

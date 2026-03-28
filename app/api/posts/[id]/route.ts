import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { updatePost } from "@/lib/db/repository";
import { postUpdateSchema } from "@/lib/validators";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const viewer = await requireViewer();
    const parsed = postUpdateSchema.parse(await request.json());
    const post = await updatePost({
      postId: params.id,
      viewerId: viewer.id,
      body: parsed.body,
      status: parsed.status,
      scheduledFor: parsed.status === "scheduled" ? parsed.scheduledFor ?? null : null
    });
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update post." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { toggleSavePost } from "@/lib/db/repository";
import { savePostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = savePostSchema.parse(await request.json());
    return NextResponse.json(await toggleSavePost(parsed.postId, viewer.id));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save post." }, { status: 400 });
  }
}

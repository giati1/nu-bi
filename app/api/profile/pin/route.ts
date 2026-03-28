import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { pinProfilePost } from "@/lib/db/repository";
import { pinPostSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = pinPostSchema.parse(await request.json());
    await pinProfilePost(parsed.postId, viewer.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to pin post." }, { status: 400 });
  }
}

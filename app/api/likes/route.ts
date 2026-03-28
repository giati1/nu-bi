import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { toggleLike } from "@/lib/db/repository";
import { likeSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = likeSchema.parse(await request.json());
    const result = await toggleLike(parsed.postId, viewer.id);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to toggle like." },
      { status: 400 }
    );
  }
}

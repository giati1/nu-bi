import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { voteOnPoll } from "@/lib/db/repository";
import { votePollSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = votePollSchema.parse(await request.json());
    const post = await voteOnPoll(parsed.optionId, viewer.id);
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to vote." }, { status: 400 });
  }
}

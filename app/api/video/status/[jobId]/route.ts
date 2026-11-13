import { NextResponse } from "next/server";
import { getVideoJobStatus } from "@/lib/ai-tools/video-provider";
import { requireViewer } from "@/lib/auth/session";

export async function GET(_request: Request, context: { params: { jobId: string } }) {
  try {
    await requireViewer();
    const status = await getVideoJobStatus(context.params.jobId);
    return NextResponse.json(status);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch video status.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 400 });
  }
}

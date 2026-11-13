import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { cleanupLowEngagementAiPosts } from "@/lib/ai-agents/cleanup";

export async function POST(request: Request) {
  try {
    await requireInternalAdminViewer();
    const payload = (await request.json().catch(() => ({}))) as {
      dryRun?: boolean;
      daysBack?: number;
    };
    const result = await cleanupLowEngagementAiPosts({
      dryRun: payload.dryRun !== false,
      daysBack: payload.daysBack ?? 7
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to clean low-engagement AI posts." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { updateAIAgentSettings } from "@/lib/db/ai-repository";

export async function PATCH(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    await requireInternalAdminViewer();
    const payload = (await request.json()) as {
      enabled?: boolean;
      postFrequencyMinutes?: number;
      maxPostsPerDay?: number;
    };
    const agent = await updateAIAgentSettings(params.agentId, {
      enabled: payload.enabled,
      postFrequencyMinutes: payload.postFrequencyMinutes,
      maxPostsPerDay: payload.maxPostsPerDay
    });
    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update AI agent." },
      { status: 400 }
    );
  }
}

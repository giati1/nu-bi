import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { runAgentNow } from "@/lib/ai-agents/scheduler";

export async function POST(
  _request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    await requireInternalAdminViewer();
    const result = await runAgentNow(params.agentId);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run AI agent." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { getAIAutomationSettings } from "@/lib/db/ai-repository";
import { runAgentNow } from "@/lib/ai-agents/scheduler";

export async function POST(
  _request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    await requireInternalAdminViewer();
    const automation = await getAIAutomationSettings();
    if (!automation.autoPostEnabled) {
      return NextResponse.json({ error: "AI posting is disabled." }, { status: 403 });
    }
    const result = await runAgentNow(params.agentId);
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run AI agent." },
      { status: 400 }
    );
  }
}

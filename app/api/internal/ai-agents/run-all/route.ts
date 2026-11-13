import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { getAIAutomationSettings } from "@/lib/db/ai-repository";
import { runAllEligibleAgentsOnce } from "@/lib/ai-agents/scheduler";

export async function POST() {
  try {
    await requireInternalAdminViewer();
    const automation = await getAIAutomationSettings();
    if (!automation.autoPostEnabled) {
      return NextResponse.json({ results: [], skipped: true, reason: "AI posting is disabled." });
    }
    const results = await runAllEligibleAgentsOnce();
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run eligible agents." },
      { status: 400 }
    );
  }
}

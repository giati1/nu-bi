import { NextResponse } from "next/server";
import { assertSchedulerSecret } from "@/lib/auth/internal";
import { getAIAutomationSettings } from "@/lib/db/ai-repository";
import { runAllEligibleAgentsOnce } from "@/lib/ai-agents/scheduler";

export async function POST(request: Request) {
  try {
    assertSchedulerSecret(request);
    const automation = await getAIAutomationSettings();
    if (!automation.autoPostEnabled) {
      return NextResponse.json({ results: [], skipped: true, reason: "Auto posting is disabled." });
    }

    const results = await runAllEligibleAgentsOnce({ maxPostsToCreate: 1 });
    return NextResponse.json({ results, automation });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduled agent run failed." },
      { status: 400 }
    );
  }
}

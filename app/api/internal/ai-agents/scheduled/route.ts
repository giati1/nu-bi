import { NextResponse } from "next/server";
import { assertSchedulerSecret } from "@/lib/auth/internal";
import { runAllEligibleAgentsOnce } from "@/lib/ai-agents/scheduler";

export async function POST(request: Request) {
  try {
    assertSchedulerSecret(request);
    const results = await runAllEligibleAgentsOnce();
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduled agent run failed." },
      { status: 400 }
    );
  }
}

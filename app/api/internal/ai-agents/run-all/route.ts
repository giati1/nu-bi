import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { runAllEligibleAgentsOnce } from "@/lib/ai-agents/scheduler";

export async function POST() {
  try {
    await requireInternalAdminViewer();
    const results = await runAllEligibleAgentsOnce();
    return NextResponse.json({ results });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run eligible agents." },
      { status: 400 }
    );
  }
}

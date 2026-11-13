import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { getAIAutomationSettings, updateAIAutomationSettings } from "@/lib/db/ai-repository";

export async function GET() {
  try {
    await requireInternalAdminViewer();
    const settings = await getAIAutomationSettings();
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to load AI automation settings." },
      { status: 400 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await requireInternalAdminViewer();
    const payload = (await request.json()) as {
      autoPostEnabled?: boolean;
      autoPostCron?: string;
      autoPostFrequency?: string;
      autoPostTime?: string;
      autoReplyEnabled?: boolean;
      requireApprovalBeforePosting?: boolean;
    };
    const settings = await updateAIAutomationSettings(payload);
    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update AI automation settings." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { ensureGeneratedAiUsers } from "@/lib/ai/ai-users";
import { seedStarterPostsForAgents } from "@/lib/ai/starter-content";
import { runAiConversationPass } from "@/lib/ai-agents/conversation-loop";

export async function POST(request: Request) {
  try {
    await requireInternalAdminViewer();
    const payload = (await request.json().catch(() => ({}))) as {
      count?: number;
      seedPosts?: boolean;
    };
    const requestedCount = Number(payload.count ?? 8);
    const count = Number.isFinite(requestedCount)
      ? Math.max(1, Math.min(Math.trunc(requestedCount), 24))
      : 8;
    const agents = await ensureGeneratedAiUsers(count);
    const seededPosts = payload.seedPosts === false ? [] : await seedStarterPostsForAgents(agents, 3);
    const totalCreatedPosts = seededPosts.reduce((sum, item) => sum + item.createdPosts, 0);
    const conversationSummary = await runAiConversationPass({
      allAgents: agents,
      topicOverride: "new AI personas joining the feed and starting fresh conversations"
    });
    return NextResponse.json({
      agents,
      count: agents.length,
      seededPosts,
      totalCreatedPosts,
      conversationSummary
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to bootstrap AI personas." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { runAiDebate } from "@/lib/ai/ai-debates";
import { all } from "@/lib/db/client";
import { listAIAgents } from "@/lib/db/ai-repository";
import { getPostById } from "@/lib/db/repository";
import { env } from "@/lib/config/env";

export async function POST() {
  try {
    if (env.cloudflareEnv !== "preview" || env.databaseDriver !== "d1") {
      return NextResponse.json(
        { error: "This internal AI debate runner is available only in preview D1 mode." },
        { status: 403 }
      );
    }

    const target = await all<{
      id: string;
      comment_count: number;
    }>(
      `SELECT p.id
            , (SELECT COUNT(*) FROM comments c WHERE c.post_id = p.id) AS comment_count
       FROM posts p
       WHERE p.deleted_at IS NULL
         AND p.status = 'published'
         AND p.ai_generation_mode = 'image_post'
         AND EXISTS (SELECT 1 FROM post_media pm WHERE pm.post_id = p.id)
       ORDER BY comment_count ASC, p.created_at DESC
       LIMIT 1`
    );

    const targetPostId = target[0]?.id;
    if (!targetPostId) {
      return NextResponse.json({ error: "No published AI image post was available for debate." }, { status: 404 });
    }

    const [post, agents] = await Promise.all([getPostById(targetPostId, ""), listAIAgents()]);
    if (!post) {
      return NextResponse.json({ error: "Target image post could not be loaded." }, { status: 404 });
    }

    const debateAgents = agents
      .filter((agent) => agent.enabled && agent.linkedUserId !== post.author.id)
      .slice(0, 6);

    const summary = await runAiDebate({
      post,
      agents: debateAgents
    });

    return NextResponse.json({
      databaseDriver: env.databaseDriver,
      cloudflareEnv: env.cloudflareEnv,
      targetPostId: post.id,
      targetPostUrl: `${env.appUrl}/post/${post.id}`,
      targetAuthor: post.author.username,
      agentsUsed: debateAgents.map((agent) => agent.slug),
      ...summary
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to run AI debate." },
      { status: 400 }
    );
  }
}

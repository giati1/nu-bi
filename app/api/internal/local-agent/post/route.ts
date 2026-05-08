import { NextResponse } from "next/server";
import { z } from "zod";
import { assertLocalAgentSecret } from "@/lib/auth/internal";
import { env } from "@/lib/config/env";
import { getAIAgentBySlug } from "@/lib/db/ai-repository";
import { createPost } from "@/lib/db/repository";

const requestSchema = z.object({
  body: z.string().trim().min(1).max(420),
  agentSlug: z.string().trim().min(2).max(64).optional().default("nomi-host"),
  mode: z.enum(["text", "news", "image_prompt"]).optional().default("text"),
  topic: z.string().trim().max(200).optional().nullable(),
  model: z.string().trim().max(80).optional().nullable()
});

export async function POST(request: Request) {
  try {
    if (env.cloudflareEnv !== "preview" || env.databaseDriver !== "d1") {
      return NextResponse.json(
        { error: "This local agent posting route is available only in preview D1 mode." },
        { status: 403 }
      );
    }

    assertLocalAgentSecret(request);
    const parsed = requestSchema.parse(await request.json());
    const agent = await getAIAgentBySlug(parsed.agentSlug);

    if (!agent?.enabled) {
      return NextResponse.json({ error: "Requested AI agent was not available." }, { status: 404 });
    }

    const post = await createPost({
      userId: agent.linkedUserId,
      body: parsed.body,
      status: "published",
      aiAgentId: agent.id,
      aiGenerationMode: `local_agent_${parsed.mode}`,
      aiTopicSeed: parsed.topic?.trim() || null
    });

    return NextResponse.json({
      ok: true,
      postId: post.id,
      postUrl: `${env.appUrl}/post/${post.id}`,
      agentSlug: agent.slug,
      mode: parsed.mode,
      topic: parsed.topic?.trim() || null,
      model: parsed.model?.trim() || null
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid local agent payload." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create local agent post." },
      { status: 400 }
    );
  }
}

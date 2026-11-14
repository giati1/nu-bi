import { NextResponse } from "next/server";
import { z } from "zod";
import { assertLocalAgentSecret } from "@/lib/auth/internal";
import { hashPassword } from "@/lib/auth/password";
import { env } from "@/lib/config/env";
import { getAIAgentBySlug, upsertAIAgent } from "@/lib/db/ai-repository";
import { createPost, createUser, getUserByUsername } from "@/lib/db/repository";

const requestSchema = z.object({
  body: z.string().trim().min(1).max(500),
  agentSlug: z.string().trim().min(2).max(64).optional().default("nubi"),
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(240).optional(),
  mode: z.enum(["text", "news", "image_prompt", "arena_spark"]).optional().default("text"),
  topic: z.string().trim().max(200).optional().nullable(),
  model: z.string().trim().max(80).optional().nullable()
});

async function resolvePosterUserAndAgent(input: z.infer<typeof requestSchema>) {
  const slug = input.agentSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  if (slug === "nubi") {
    const nubiUser = await getUserByUsername("nubi");
    if (nubiUser) {
      return { userId: nubiUser.id, agentId: null, slug: "nubi" };
    }
  }

  const existingAgent = await getAIAgentBySlug(slug);
  if (existingAgent) {
    return { userId: existingAgent.linkedUserId, agentId: existingAgent.id, slug: existingAgent.slug };
  }

  let user = await getUserByUsername(slug);
  if (!user) {
    const passwordHash = await hashPassword(`arena-${slug}-${Date.now()}`);
    user = await createUser({
      email: `${slug}@nubi.ai`,
      username: slug,
      displayName: input.displayName ?? slug,
      passwordHash
    });
  }

  if (!user) {
    throw new Error(`Could not resolve user account for ${slug}`);
  }

  const agent = await upsertAIAgent({
    linkedUserId: user.id,
    slug,
    displayName: input.displayName ?? user.displayName,
    handle: `@${user.username}`,
    category: "arena",
    personaPrompt: `You are ${input.displayName ?? user.displayName} (@${user.username}) in the NU-BI Arena.`,
    description: input.bio ?? "NU-BI Arena Host",
    contentModes: ["text"],
    postFrequencyMinutes: 1440,
    maxPostsPerDay: 5,
    enabled: true
  });

  return { userId: user.id, agentId: agent?.id ?? null, slug };
}

export async function POST(request: Request) {
  try {
    assertLocalAgentSecret(request);
    const parsed = requestSchema.parse(await request.json());
    const poster = await resolvePosterUserAndAgent(parsed);

    const post = await createPost({
      userId: poster.userId,
      body: parsed.body,
      status: "published",
      aiAgentId: poster.agentId,
      aiGenerationMode: `local_agent_${parsed.mode}`,
      aiTopicSeed: parsed.topic?.trim() || null
    });

    if (!post) {
      return NextResponse.json({ error: "Failed to create post." }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      postId: post.id,
      postUrl: `${env.appUrl.replace(/\/$/, "")}/post/${post.id}`,
      agentSlug: poster.slug,
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

    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create local agent post." },
      { status }
    );
  }
}

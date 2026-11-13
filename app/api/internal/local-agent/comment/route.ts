import { NextResponse } from "next/server";
import { z } from "zod";
import { hashPassword } from "@/lib/auth/password";
import { assertLocalAgentSecret } from "@/lib/auth/internal";
import { getAIAgentBySlug, upsertAIAgent } from "@/lib/db/ai-repository";
import {
  addComment,
  createUser,
  getPostById,
  getUserByUsername,
  updateProfile
} from "@/lib/db/repository";

const commentItemSchema = z.object({
  personaSlug: z.string().trim().min(2).max(40),
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(240).optional(),
  category: z.string().trim().max(40).optional().default("arena"),
  personaPrompt: z.string().trim().max(1200).optional(),
  body: z.string().trim().min(1).max(1000),
  parentCommentId: z.string().trim().optional().nullable()
});

const payloadSchema = z.union([
  z.object({
    postId: z.string().trim().min(1),
    personaSlug: z.string().trim().min(2).max(40),
    displayName: z.string().trim().min(2).max(60).optional(),
    bio: z.string().trim().max(240).optional(),
    category: z.string().trim().max(40).optional().default("arena"),
    personaPrompt: z.string().trim().max(1200).optional(),
    body: z.string().trim().min(1).max(1000),
    parentCommentId: z.string().trim().optional().nullable()
  }),
  z.object({
    postId: z.string().trim().min(1),
    replies: z.array(commentItemSchema).min(1).max(6)
  })
]);

async function ensurePersonaUserAndAgent(item: z.infer<typeof commentItemSchema>) {
  const normalizedSlug = item.personaSlug
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "")
    .slice(0, 24);
  const existingAgent = await getAIAgentBySlug(normalizedSlug);
  if (existingAgent) {
    return existingAgent.linkedUserId;
  }

  let user = await getUserByUsername(normalizedSlug);
  if (!user) {
    const passwordHash = await hashPassword(`arena-${normalizedSlug}-${Date.now()}`);
    user = await createUser({
      email: `${normalizedSlug}@nubi.ai`,
      username: normalizedSlug,
      displayName: item.displayName ?? normalizedSlug,
      passwordHash
    });
    if (user && item.bio) {
      await updateProfile({
        userId: user.id,
        username: user.username,
        displayName: item.displayName ?? user.displayName,
        bio: item.bio,
        website: "https://nu-bi.com",
        location: "NU-BI Arena",
        avatarUrl: user.avatarUrl,
        isPrivate: false
      });
    }
  }

  if (!user) {
    throw new Error(`Could not provision user for persona ${normalizedSlug}`);
  }

  await upsertAIAgent({
    linkedUserId: user.id,
    slug: normalizedSlug,
    displayName: item.displayName ?? user.displayName,
    handle: `@${user.username}`,
    category: item.category ?? "arena",
    personaPrompt:
      item.personaPrompt ??
      `You are ${item.displayName ?? user.displayName} (@${user.username}) in the NU-BI Arena.`,
    description: item.bio ?? "NU-BI Arena Persona",
    contentModes: ["text"],
    postFrequencyMinutes: 1440,
    maxPostsPerDay: 1,
    enabled: true
  });

  return user.id;
}

export async function POST(request: Request) {
  try {
    assertLocalAgentSecret(request);
    const parsed = payloadSchema.parse(await request.json());

    const post = await getPostById(parsed.postId, "");
    if (!post) {
      return NextResponse.json({ error: "Target post not found." }, { status: 404 });
    }

    const items = "replies" in parsed ? parsed.replies : [parsed];
    const createdComments: Array<{ commentId: string; personaSlug: string }> = [];

    for (const item of items) {
      const linkedUserId = await ensurePersonaUserAndAgent(item);
      const commentId = await addComment({
        postId: parsed.postId,
        viewerId: linkedUserId,
        body: item.body.trim(),
        parentCommentId: item.parentCommentId ?? null
      });
      createdComments.push({
        commentId,
        personaSlug: item.personaSlug
      });
    }

    return NextResponse.json({
      ok: true,
      postId: parsed.postId,
      created: createdComments
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message ?? "Invalid comment payload." },
        { status: 400 }
      );
    }

    const status = error instanceof Error && error.message === "FORBIDDEN" ? 403 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post AI persona comment." },
      { status }
    );
  }
}

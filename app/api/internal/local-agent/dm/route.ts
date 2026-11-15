import { NextResponse } from "next/server";
import { z } from "zod";
import { ARENA_FIGHTERS, isAutomatedVoiceUsername } from "@/lib/arena-personas";
import { assertLocalAgentSecret } from "@/lib/auth/internal";
import { hashPassword } from "@/lib/auth/password";
import { all } from "@/lib/db/client";
import {
  createUser,
  getUserById,
  getUserByUsername,
  sendMessage,
  updateProfile
} from "@/lib/db/repository";

const dmCallbackSchema = z.object({
  conversationId: z.string().trim().min(1),
  personaSlug: z.string().trim().min(2).max(40),
  displayName: z.string().trim().min(2).max(60).optional(),
  bio: z.string().trim().max(240).optional(),
  body: z.string().trim().min(1).max(1200),
  replyToMessageId: z.string().trim().optional().nullable()
});

async function resolveVoiceSenderId(
  conversationId: string,
  personaSlug: string,
  displayName?: string,
  bio?: string
) {
  const memberRows = await all<{ user_id: string }>(
    `SELECT user_id FROM conversation_members WHERE conversation_id = ?`,
    [conversationId]
  );

  for (const row of memberRows) {
    const memberUser = await getUserById(row.user_id);
    if (memberUser && isAutomatedVoiceUsername(memberUser.username)) {
      return memberUser.id;
    }
  }

  const normalizedSlug = personaSlug.toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 24);
  const fighter = ARENA_FIGHTERS.find(
    (f) => f.slug === normalizedSlug || f.legacySlug === normalizedSlug
  );

  let user =
    (await getUserByUsername(normalizedSlug)) ??
    (fighter ? await getUserByUsername(fighter.slug) : null) ??
    (fighter ? await getUserByUsername(fighter.legacySlug) : null);

  if (!user) {
    const passwordHash = await hashPassword(`voice-dm-${normalizedSlug}-${Date.now()}`);
    user = await createUser({
      email: `${normalizedSlug}@nubi.social`,
      username: fighter?.slug ?? normalizedSlug,
      displayName: fighter?.name ?? displayName ?? normalizedSlug,
      passwordHash
    });
    if (user) {
      await updateProfile({
        userId: user.id,
        username: user.username,
        displayName: fighter?.name ?? displayName ?? user.displayName,
        bio: fighter?.bio ?? bio ?? "",
        website: "https://nu-bi.com",
        location: "NU-BI",
        avatarUrl: user.avatarUrl,
        isPrivate: false
      });
    }
  }

  if (!user) {
    throw new Error(`Could not resolve voice sender for ${normalizedSlug}`);
  }

  return user.id;
}

export async function POST(request: Request) {
  try {
    assertLocalAgentSecret(request);
    const parsed = dmCallbackSchema.parse(await request.json());

    const senderId = await resolveVoiceSenderId(
      parsed.conversationId,
      parsed.personaSlug,
      parsed.displayName,
      parsed.bio
    );

    const result = await sendMessage({
      senderId,
      conversationId: parsed.conversationId,
      body: parsed.body.trim(),
      replyToMessageId: parsed.replyToMessageId ?? null
    });

    return NextResponse.json({
      ok: true,
      conversationId: result.conversationId,
      messageId: result.messageId
    });
  } catch (error) {
    const status =
      error instanceof Error && error.message.toLowerCase().includes("unauthorized") ? 401 : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to post DM reply." },
      { status }
    );
  }
}

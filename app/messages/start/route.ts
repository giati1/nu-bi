import { NextResponse } from "next/server";
import { ARENA_FIGHTERS } from "@/lib/arena-personas";
import { hashPassword } from "@/lib/auth/password";
import { requireViewer } from "@/lib/auth/session";
import { get } from "@/lib/db/client";
import {
  createOrGetDirectConversation,
  createUser,
  getUserById,
  getUserByUsername,
  sendMessage,
  updateProfile
} from "@/lib/db/repository";

async function resolveTargetUser(recipientId: string, username: string) {
  if (recipientId) {
    const byId = await getUserById(recipientId);
    if (byId) {
      return byId;
    }
  }

  if (!username) {
    return null;
  }

  const lower = username.toLowerCase();
  const fighter = ARENA_FIGHTERS.find(
    (f) => f.slug.toLowerCase() === lower || f.legacySlug.toLowerCase() === lower
  );

  let user =
    (await getUserByUsername(lower)) ??
    (fighter ? await getUserByUsername(fighter.slug) : null) ??
    (fighter ? await getUserByUsername(fighter.legacySlug) : null);

  if (!user && fighter) {
    const passwordHash = await hashPassword(`insider-${fighter.slug}-${Date.now()}`);
    user = await createUser({
      email: `${fighter.slug}@nubi.social`,
      username: fighter.slug,
      displayName: fighter.name,
      passwordHash
    });
    if (user) {
      user = await updateProfile({
        userId: user.id,
        username: fighter.slug,
        displayName: fighter.name,
        bio: fighter.bio,
        website: "https://nu-bi.com",
        location: "NU-BI",
        avatarUrl: fighter.avatarUrl,
        isPrivate: false
      });
    }
  }

  return user;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const recipientId = url.searchParams.get("recipientId")?.trim() ?? "";
  const username = url.searchParams.get("username")?.trim() ?? "";

  try {
    const viewer = await requireViewer();
    const targetUser = await resolveTargetUser(recipientId, username);

    if (!targetUser || targetUser.id === viewer.id) {
      return NextResponse.redirect(new URL("/messages", request.url));
    }

    const conversationId = await createOrGetDirectConversation(viewer.id, targetUser.id);

    const existingCount = await get<{ count: number }>(
      `SELECT COUNT(*) AS count FROM messages WHERE conversation_id = ?`,
      [conversationId]
    );

    if ((existingCount?.count ?? 0) === 0) {
      const fighter = ARENA_FIGHTERS.find(
        (f) =>
          f.slug === targetUser.username.toLowerCase() ||
          f.legacySlug === targetUser.username.toLowerCase()
      );
      if (fighter) {
        await sendMessage({
          senderId: targetUser.id,
          conversationId,
          body: `Yo ${viewer.displayName} — ${fighter.name} (@${fighter.slug}) here. ${fighter.bio} Drop whatever is on your mind and let's get into it.`
        });
      }
    }

    return NextResponse.redirect(new URL(`/messages/${conversationId}`, request.url));
  } catch {
    const nextPath = `/messages/start${url.search}`;
    return NextResponse.redirect(
      new URL(`/login?next=${encodeURIComponent(nextPath)}`, request.url)
    );
  }
}

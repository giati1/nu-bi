import crypto from "crypto";
import { get, run } from "@/lib/db/client";

export async function createNotification(input: {
  userId: string;
  actorId?: string | null;
  type: string;
  entityType?: string | null;
  entityId?: string | null;
}) {
  const prefs = await get<{
    likes_enabled: number;
    comments_enabled: number;
    follows_enabled: number;
    messages_enabled: number;
  }>(`SELECT likes_enabled, comments_enabled, follows_enabled, messages_enabled FROM notification_preferences WHERE user_id = ?`, [
    input.userId
  ]);

  if (
    (input.type === "like" && prefs && !prefs.likes_enabled) ||
    (input.type === "story_reaction" && prefs && !prefs.likes_enabled) ||
    (input.type === "repost" && prefs && !prefs.likes_enabled) ||
    (input.type === "comment" && prefs && !prefs.comments_enabled) ||
    (input.type === "mention" && prefs && !prefs.comments_enabled) ||
    (input.type === "story_reply" && prefs && !prefs.comments_enabled) ||
    (input.type === "follow" && prefs && !prefs.follows_enabled) ||
    (input.type === "message" && prefs && !prefs.messages_enabled)
  ) {
    return;
  }

  await run(
    `INSERT INTO notifications (id, user_id, actor_id, type, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      crypto.randomUUID(),
      input.userId,
      input.actorId ?? null,
      input.type,
      input.entityType ?? null,
      input.entityId ?? null
    ]
  );
}

import { all, get, run } from "@/lib/db/client";

export type Companion = {
  id: string;
  name: string;
  personality: string;
  appearance: string;
  createdAt: string;
};

export type CompanionMessage = {
  id: string;
  role: "user" | "assistant";
  body: string;
  createdAt: string;
};

type CompanionRow = { id: string; name: string; personality: string; appearance: string; created_at: string };
type MessageRow = { id: string; role: "user" | "assistant"; body: string; created_at: string };

function mapCompanion(row: CompanionRow): Companion {
  return { id: row.id, name: row.name, personality: row.personality, appearance: row.appearance, createdAt: row.created_at };
}

export async function listCompanions(ownerUserId: string) {
  const rows = await all<CompanionRow>(
    "SELECT id, name, personality, appearance, created_at FROM companion_profiles WHERE owner_user_id = ? ORDER BY updated_at DESC LIMIT 30",
    [ownerUserId]
  );
  return rows.map(mapCompanion);
}

export async function getCompanion(ownerUserId: string, companionId: string) {
  const row = await get<CompanionRow>(
    "SELECT id, name, personality, appearance, created_at FROM companion_profiles WHERE owner_user_id = ? AND id = ?",
    [ownerUserId, companionId]
  );
  return row ? mapCompanion(row) : null;
}

export async function createCompanion(ownerUserId: string, input: { name: string; personality: string; appearance: string }) {
  const id = crypto.randomUUID();
  await run(
    "INSERT INTO companion_profiles (id, owner_user_id, name, personality, appearance) VALUES (?, ?, ?, ?, ?)",
    [id, ownerUserId, input.name, input.personality, input.appearance]
  );
  return await getCompanion(ownerUserId, id);
}

export async function deleteCompanion(ownerUserId: string, companionId: string) {
  await run("DELETE FROM companion_messages WHERE owner_user_id = ? AND companion_id = ?", [ownerUserId, companionId]);
  const result = await run("DELETE FROM companion_profiles WHERE owner_user_id = ? AND id = ?", [ownerUserId, companionId]);
  return result.changes > 0;
}

export async function listMessages(ownerUserId: string, companionId: string) {
  const rows = await all<MessageRow>(
    "SELECT id, role, body, created_at FROM companion_messages WHERE owner_user_id = ? AND companion_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 60",
    [ownerUserId, companionId]
  );
  return rows.reverse().map((row): CompanionMessage => ({ id: row.id, role: row.role, body: row.body, createdAt: row.created_at }));
}

export async function saveMessage(ownerUserId: string, companionId: string, role: "user" | "assistant", body: string) {
  const id = crypto.randomUUID();
  await run(
    "INSERT INTO companion_messages (id, companion_id, owner_user_id, role, body) VALUES (?, ?, ?, ?, ?)",
    [id, companionId, ownerUserId, role, body]
  );
  await run("UPDATE companion_profiles SET updated_at = CURRENT_TIMESTAMP WHERE id = ? AND owner_user_id = ?", [companionId, ownerUserId]);
  return { id, role, body, createdAt: new Date().toISOString() } satisfies CompanionMessage;
}

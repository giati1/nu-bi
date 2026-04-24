import { ensureDatabase, all, run } from "../lib/db/client";

type AiPostRow = {
  id: string;
};

async function main() {
  await ensureDatabase();

  const args = process.argv.slice(2);
  const deleteTodayOnly = !args.includes("--all");

  const where = deleteTodayOnly
    ? "ai_agent_id IS NOT NULL AND deleted_at IS NULL AND date(created_at) = date('now')"
    : "ai_agent_id IS NOT NULL AND deleted_at IS NULL";

  const rows = await all<AiPostRow>(`SELECT id FROM posts WHERE ${where} ORDER BY created_at DESC`);
  await run(`UPDATE posts SET deleted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE ${where}`);

  console.log(
    JSON.stringify(
      {
        deletedCount: rows.length,
        deletedPostIds: rows.map((row) => row.id),
        scope: deleteTodayOnly ? "today" : "all"
      },
      null,
      2
    )
  );
}

void main();

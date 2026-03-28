import fs from "fs/promises";
import path from "path";
import sqlite3 from "sqlite3";
import { env } from "@/lib/config/env";

type RunResult = {
  lastID: number;
  changes: number;
};

let database: sqlite3.Database | null = null;
let setupPromise: Promise<void> | null = null;

function getDatabase() {
  if (!database) {
    database = new sqlite3.Database(env.databasePath);
  }
  return database;
}

async function rawRun(sql: string, params: unknown[] = []) {
  const db = getDatabase();
  return await new Promise<RunResult>((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }
      resolve({
        lastID: this.lastID,
        changes: this.changes
      });
    });
  });
}

async function rawGet<T>(sql: string, params: unknown[] = []) {
  const db = getDatabase();
  return await new Promise<T | undefined>((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(row as T | undefined);
    });
  });
}

export async function ensureDatabase() {
  if (!setupPromise) {
    setupPromise = (async () => {
      await fs.mkdir(path.dirname(env.databasePath), { recursive: true });
      const migrationsDir = path.resolve(process.cwd(), "db/migrations");
      const files = (await fs.readdir(migrationsDir))
        .filter((file) => file.endsWith(".sql"))
        .sort();

      await exec(
        `CREATE TABLE IF NOT EXISTS schema_migrations (
           id TEXT PRIMARY KEY,
           applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         )`
      );

      for (const file of files) {
        const applied = await rawGet<{ id: string }>(
          `SELECT id FROM schema_migrations WHERE id = ?`,
          [file]
        );
        if (applied) {
          continue;
        }

        const migration = await fs.readFile(path.join(migrationsDir, file), "utf8");
        await exec(migration);
        await rawRun(`INSERT INTO schema_migrations (id) VALUES (?)`, [file]);
      }
    })();
  }

  await setupPromise;
}

export async function exec(sql: string) {
  const db = getDatabase();
  await new Promise<void>((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

export async function run(sql: string, params: unknown[] = []) {
  await ensureDatabase();
  return await rawRun(sql, params);
}

export async function get<T>(sql: string, params: unknown[] = []) {
  await ensureDatabase();
  return await rawGet<T>(sql, params);
}

export async function all<T>(sql: string, params: unknown[] = []) {
  await ensureDatabase();
  const db = getDatabase();
  return await new Promise<T[]>((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) {
        reject(error);
        return;
      }
      resolve((rows as T[]) ?? []);
    });
  });
}

export async function transaction<T>(callback: () => Promise<T>) {
  await run("BEGIN");
  try {
    const result = await callback();
    await run("COMMIT");
    return result;
  } catch (error) {
    await run("ROLLBACK");
    throw error;
  }
}

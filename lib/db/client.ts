import { env, usesD1 } from "@/lib/config/env";
import { getCloudflareBindingsAsync, getCloudflareContextAsync } from "@/lib/cloudflare/context";

type RunResult = {
  lastID: number;
  changes: number;
};

type SqliteDatabase = {
  run: (
    sql: string,
    params: unknown[],
    callback: (this: { lastID: number; changes: number }, error: Error | null) => void
  ) => void;
  get: (sql: string, params: unknown[], callback: (error: Error | null, row?: unknown) => void) => void;
  all: (sql: string, params: unknown[], callback: (error: Error | null, rows?: unknown[]) => void) => void;
  exec: (sql: string, callback: (error: Error | null) => void) => void;
};

let sqliteDatabase: SqliteDatabase | null = null;
let sqliteConnectionSetupPromise: Promise<void> | null = null;
let sqliteSetupPromise: Promise<void> | null = null;

async function getD1Database() {
  return (await getCloudflareBindingsAsync())?.DB ?? null;
}

async function requireD1Database() {
  const d1 = await getD1Database();
  if (!d1) {
    const cloudflareContext = await getCloudflareContextAsync();
    console.error("[d1] Cloudflare DB binding unavailable", {
      databaseDriver: env.databaseDriver,
      cloudflareEnv: env.cloudflareEnv,
      hasContext: Boolean(cloudflareContext),
      contextKeys: cloudflareContext ? Object.keys(cloudflareContext) : [],
      envKeys: cloudflareContext?.env ? Object.keys(cloudflareContext.env) : [],
      context: cloudflareContext
    });
    throw new Error(
      "DATABASE_DRIVER is set to d1, but the Cloudflare DB binding is unavailable. Use wrangler dev/deploy for D1, or switch DATABASE_DRIVER=sqlite for local Node development."
    );
  }
  return d1;
}

async function getSqliteDatabase() {
  if (!sqliteDatabase) {
    const sqlite3 = (await import("sqlite3")).default;
    sqliteDatabase = new sqlite3.Database(env.databasePath) as unknown as SqliteDatabase;
    sqliteConnectionSetupPromise = configureLocalSqliteDatabase(sqliteDatabase);
  }

  if (sqliteConnectionSetupPromise) {
    await sqliteConnectionSetupPromise;
  }

  return sqliteDatabase;
}

async function configureLocalSqliteDatabase(db: SqliteDatabase) {
  await execOnDatabase(
    db,
    `PRAGMA busy_timeout = 5000;
     PRAGMA journal_mode = WAL;`
  );
}

async function rawRunLocal(sql: string, params: unknown[] = []) {
  const db = await getSqliteDatabase();
  return await new Promise<RunResult>((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        logLocalSqliteFailure("run", sql, error);
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

async function rawGetLocal<T>(sql: string, params: unknown[] = []) {
  const db = await getSqliteDatabase();
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

async function rawAllLocal<T>(sql: string, params: unknown[] = []) {
  const db = await getSqliteDatabase();
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

async function rawExecLocal(sql: string) {
  const db = await getSqliteDatabase();
  await execOnDatabase(db, sql);
}

async function execOnDatabase(db: SqliteDatabase, sql: string) {
  await new Promise<void>((resolve, reject) => {
    db.exec(sql, (error) => {
      if (error) {
        logLocalSqliteFailure("exec", sql, error);
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function logLocalSqliteFailure(operation: "exec" | "run", sql: string, error: Error) {
  console.error("[sqlite] local database write failed", {
    operation,
    databasePath: env.databasePath,
    ...getSqliteErrorDetails(error),
    sql: summarizeSql(sql)
  });
}

function getSqliteErrorDetails(error: Error) {
  const sqliteError = error as Error & { code?: string; errno?: number };
  return {
    code: sqliteError.code,
    errno: sqliteError.errno,
    message: error.message
  };
}

function summarizeSql(sql: string) {
  return sql.trim().replace(/\s+/g, " ").slice(0, 180);
}

async function ensureLocalDatabase() {
  if (!sqliteSetupPromise) {
    sqliteSetupPromise = (async () => {
      const fs = await import("fs/promises");
      const path = await import("path");

      await fs.mkdir(path.dirname(env.databasePath), { recursive: true });
      const migrationsDir = path.resolve(process.cwd(), "db/migrations");
      const files = (await fs.readdir(migrationsDir))
        .filter((file) => file.endsWith(".sql"))
        .sort();

      await rawExecLocal(
        `CREATE TABLE IF NOT EXISTS schema_migrations (
           id TEXT PRIMARY KEY,
           applied_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
         )`
      );

      for (const file of files) {
        const applied = await rawGetLocal<{ id: string }>(
          `SELECT id FROM schema_migrations WHERE id = ?`,
          [file]
        );
        if (applied) {
          continue;
        }

        const migration = await fs.readFile(path.join(migrationsDir, file), "utf8");
        await rawExecLocal(migration);
        await rawRunLocal(`INSERT INTO schema_migrations (id) VALUES (?)`, [file]);
      }
    })();
  }

  await sqliteSetupPromise;
}

export async function ensureDatabase() {
  if (usesD1()) {
    await requireD1Database();
    return;
  }

  await ensureLocalDatabase();
}

export async function exec(sql: string) {
  if (usesD1()) {
    const d1 = await requireD1Database();
    await d1.exec(sql);
    return;
  }

  await ensureLocalDatabase();
  await rawExecLocal(sql);
}

export async function run(sql: string, params: unknown[] = []) {
  if (usesD1()) {
    const d1 = await requireD1Database();
    const result = await d1.prepare(sql).bind(...params).run();
    return {
      lastID: Number(result.meta?.last_row_id ?? 0),
      changes: Number(result.meta?.changes ?? 0)
    } satisfies RunResult;
  }

  await ensureLocalDatabase();
  return await rawRunLocal(sql, params);
}

export async function get<T>(sql: string, params: unknown[] = []) {
  if (usesD1()) {
    const d1 = await requireD1Database();
    const result = await d1.prepare(sql).bind(...params).first<T>();
    return (result ?? undefined) as T | undefined;
  }

  await ensureLocalDatabase();
  return await rawGetLocal<T>(sql, params);
}

export async function all<T>(sql: string, params: unknown[] = []) {
  if (usesD1()) {
    const d1 = await requireD1Database();
    const result = await d1.prepare(sql).bind(...params).all<T>();
    return result.results ?? [];
  }

  await ensureLocalDatabase();
  return await rawAllLocal<T>(sql, params);
}

export async function transaction<T>(callback: () => Promise<T>) {
  if (usesD1()) {
    try {
      // Cloudflare D1 rejects raw BEGIN/COMMIT/ROLLBACK SQL in Workers.
      // Run the callback as an application-level unit of work instead.
      return await callback();
    } catch (error) {
      console.error("[d1] transaction callback failed; no SQL rollback is available in this runtime", {
        message: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

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

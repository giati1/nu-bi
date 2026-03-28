import path from "path";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000",
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH ?? "./db/local.sqlite"),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "nubi_session",
  sessionMaxAgeDays: Number.parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "14", 10),
  storageDriver: process.env.STORAGE_DRIVER ?? "local",
  uploadsDir: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "./public/uploads"),
  publicStorageBasePath: process.env.NEXT_PUBLIC_STORAGE_BASE_PATH ?? "/uploads",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? ""
};

export function isProduction() {
  return env.nodeEnv === "production";
}

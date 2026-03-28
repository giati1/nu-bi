import path from "path";

const defaultPort = process.env.PORT ?? "8000";
const databaseDriver = process.env.DATABASE_DRIVER ?? "sqlite";
const storageDriver = process.env.STORAGE_DRIVER ?? "local";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appPort: Number.parseInt(defaultPort, 10),
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? `http://localhost:${defaultPort}`,
  databaseDriver,
  databasePath: resolveLocalPath(process.env.DATABASE_PATH, "./db/local.sqlite"),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "nubi_session",
  sessionMaxAgeDays: Number.parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "14", 10),
  storageDriver,
  uploadsDir: resolveLocalPath(process.env.UPLOADS_DIR, "./public/uploads"),
  publicStorageBasePath: process.env.NEXT_PUBLIC_STORAGE_BASE_PATH ?? "/uploads",
  publicMediaBasePath: process.env.NEXT_PUBLIC_MEDIA_BASE_PATH ?? "/api/media",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
  cloudflareEnv: process.env.CLOUDFLARE_ENV ?? "production",
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiTextModel: process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini",
  openAiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini"
};

export function isProduction() {
  return env.nodeEnv === "production";
}

export function usesD1() {
  return env.databaseDriver === "d1";
}

export function usesLocalDatabase() {
  return env.databaseDriver === "sqlite";
}

export function usesR2() {
  return env.storageDriver === "r2" || env.storageDriver === "cloudflare";
}

export function usesLocalStorage() {
  return env.storageDriver === "local";
}

function resolveLocalPath(value: string | undefined, fallback: string) {
  return path.resolve(process.cwd(), value ?? fallback);
}

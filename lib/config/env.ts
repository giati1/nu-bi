import path from "path";

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:8000",
  databasePath: path.resolve(process.cwd(), process.env.DATABASE_PATH ?? "./db/local.sqlite"),
  databaseDriver: process.env.DATABASE_DRIVER ?? "sqlite",
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "nubi_session",
  sessionMaxAgeDays: Number.parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "14", 10),
  storageDriver: process.env.STORAGE_DRIVER ?? "local",
  uploadsDir: path.resolve(process.cwd(), process.env.UPLOADS_DIR ?? "./public/uploads"),
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

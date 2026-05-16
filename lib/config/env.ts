import path from "path";

const defaultPort = process.env.PORT ?? "8000";
const databaseDriver = process.env.DATABASE_DRIVER ?? "sqlite";
const storageDriver = process.env.STORAGE_DRIVER ?? "local";
const cloudflareEnv = process.env.CLOUDFLARE_ENV ?? "production";
const defaultAppUrl = cloudflareEnv === "preview"
  ? "https://nu-bi-preview.cedricfjohnson.workers.dev"
  : `http://localhost:${defaultPort}`;
const normalizedAppUrl = normalizeConfiguredAppUrl(process.env.NEXT_PUBLIC_APP_URL, cloudflareEnv, defaultAppUrl);
const autoPostEnabled = parseBooleanFlag(process.env.AUTO_POST_ENABLED, true);
const autoReplyEnabled = parseBooleanFlag(process.env.AUTO_REPLY_ENABLED, true);
const requireApprovalBeforePosting = parseBooleanFlag(process.env.REQUIRE_APPROVAL_BEFORE_POSTING, false);

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  appPort: Number.parseInt(defaultPort, 10),
  appUrl: normalizedAppUrl,
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  googleRedirectUri:
    process.env.GOOGLE_REDIRECT_URI ??
    `${normalizedAppUrl}/api/auth/google/callback`,
  databaseDriver,
  databasePath: resolveLocalPath(process.env.DATABASE_PATH, "./db/local.sqlite"),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? "nubi_session",
  sessionMaxAgeDays: Number.parseInt(process.env.SESSION_MAX_AGE_DAYS ?? "14", 10),
  storageDriver,
  uploadsDir: resolveLocalPath(process.env.UPLOADS_DIR, "./public/uploads"),
  publicStorageBasePath: process.env.NEXT_PUBLIC_STORAGE_BASE_PATH ?? "/uploads",
  publicMediaBasePath: process.env.NEXT_PUBLIC_MEDIA_BASE_PATH ?? "/api/media",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
  cloudflareEnv,
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openAiTextModel: process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini",
  openAiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini",
  openAiVideoModel: process.env.OPENAI_VIDEO_MODEL ?? "sora-2",
  aiAgentAdminUsernames: parseCsv(process.env.AI_AGENT_ADMIN_USERNAMES ?? "nubi"),
  aiAgentSchedulerSecret: process.env.AI_AGENT_SCHEDULER_SECRET ?? "",
  localAgentSecret: process.env.LOCAL_AGENT_SECRET ?? "",
  autoPostEnabled,
  autoPostCron: process.env.AUTO_POST_CRON ?? "0 14 * * *",
  autoPostFrequency: process.env.AUTO_POST_FREQUENCY ?? "daily",
  autoPostTime: process.env.AUTO_POST_TIME ?? "14:00",
  autoReplyEnabled,
  requireApprovalBeforePosting
};

export function isProduction() {
  return env.nodeEnv === "production";
}

export function shouldUseSecureCookies() {
  try {
    return getSafeAppBaseUrl()?.protocol === "https:";
  } catch {
    return isProduction();
  }
}

export function getSafeAppBaseUrl() {
  return tryParseAbsoluteHttpUrl(env.appUrl);
}

export function getSafeGoogleRedirectUrl() {
  return tryParseAbsoluteHttpUrl(env.googleRedirectUri);
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

function parseCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

function parseBooleanFlag(value: string | undefined, fallback: boolean) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function normalizeConfiguredAppUrl(value: string | undefined, runtimeEnv: string, fallback: string) {
  const parsed = tryParseAbsoluteHttpUrl(value ?? "");
  if (!parsed) {
    return fallback;
  }

  if (runtimeEnv === "preview" && isLocalHostname(parsed.hostname)) {
    return "https://nu-bi-preview.cedricfjohnson.workers.dev";
  }

  return parsed.toString().replace(/\/$/, "");
}

function isLocalHostname(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

function tryParseAbsoluteHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    if (!parsed.hostname || parsed.hostname.length < 2) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

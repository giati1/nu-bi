import { env, getSafeAppBaseUrl } from "@/lib/config/env";

export function buildAuthRedirectUrl(input: {
  request: Request;
  pathname: string;
  searchParams?: Record<string, string | null | undefined>;
}) {
  const base = resolveAuthBaseUrl(input.request);
  const url = new URL(input.pathname, base);

  for (const [key, value] of Object.entries(input.searchParams ?? {})) {
    if (value) {
      url.searchParams.set(key, value);
    }
  }

  return url;
}

export function sanitizeAuthNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/home";
  }
  return value;
}

export function resolveAuthBaseUrl(request: Request) {
  const requestBase = tryResolveRequestOrigin(request);
  if (requestBase) {
    return requestBase;
  }

  const envBase = getSafeAppBaseUrl();
  if (envBase) {
    return envBase;
  }

  const fallback = env.cloudflareEnv === "preview"
    ? "https://nu-bi-preview.cedricfjohnson.workers.dev"
    : "http://localhost:8000";

  return new URL(fallback);
}

export function getRequestOrigin(request: Request) {
  const forwardedHost = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const protocol = forwardedProto === "http" || forwardedProto === "https"
      ? forwardedProto
      : env.cloudflareEnv === "preview" || env.nodeEnv === "production"
        ? "https"
        : "http";
    const candidate = `${protocol}://${forwardedHost}`;
    const resolved = tryResolveAbsoluteOrigin(candidate);
    if (resolved) {
      return resolved;
    }
  }

  return tryResolveAbsoluteOrigin(request.url);
}

function tryResolveRequestOrigin(request: Request) {
  const resolved = getRequestOrigin(request);
  if (!resolved) {
    return null;
  }

  if (env.cloudflareEnv === "preview" && isLocalOrigin(resolved)) {
    return new URL("https://nu-bi-preview.cedricfjohnson.workers.dev");
  }

  return resolved;
}

function tryResolveAbsoluteOrigin(value: string | URL) {
  try {
    const parsed = typeof value === "string" ? new URL(value) : value;
    if ((parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.hostname.length >= 2) {
      return new URL(parsed.origin);
    }
  } catch {
    return null;
  }

  return null;
}

function isLocalOrigin(url: URL) {
  return url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
}

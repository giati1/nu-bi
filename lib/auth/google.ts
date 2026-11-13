import { createRemoteJWKSet, jwtVerify } from "jose";
import { env, getSafeGoogleRedirectUrl } from "@/lib/config/env";
import { makeUsernameCandidate, normalizeEmail } from "@/lib/identity";

const GOOGLE_ISSUERS = new Set(["accounts.google.com", "https://accounts.google.com"]);
const googleJwks = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

type GoogleTokenResponse = {
  access_token: string;
  id_token?: string;
  expires_in: number;
  scope: string;
  token_type: string;
};

type GoogleIdentity = {
  sub: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture: string | null;
  givenName: string | null;
  familyName: string | null;
};

type GoogleJwtPayload = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  iss?: string;
  aud?: string | string[];
};

export function isGoogleAuthConfigured() {
  return Boolean(env.googleClientId && env.googleClientSecret && getSafeGoogleRedirectUrl());
}

export function buildGoogleAuthUrl(input: { state: string }) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  const redirectUrl = getRequiredGoogleRedirectUri();
  url.searchParams.set("client_id", env.googleClientId);
  url.searchParams.set("redirect_uri", redirectUrl);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", input.state);
  url.searchParams.set("access_type", "online");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeGoogleCode(code: string) {
  const redirectUrl = getRequiredGoogleRedirectUri();
  const body = new URLSearchParams({
    code,
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    redirect_uri: redirectUrl,
    grant_type: "authorization_code"
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    const payload = await safeJson(response);
    throw new Error(
      `Google token exchange failed: ${payload.error_description ?? payload.error ?? response.statusText}`
    );
  }

  return (await response.json()) as GoogleTokenResponse;
}

function getRequiredGoogleRedirectUri() {
  const redirectUrl = getSafeGoogleRedirectUrl();
  if (!redirectUrl) {
    throw new Error("Google redirect URI is missing or invalid.");
  }
  return redirectUrl.toString();
}

export async function resolveGoogleIdentity(tokens: GoogleTokenResponse) {
  if (tokens.id_token) {
    const { payload } = await jwtVerify(tokens.id_token, googleJwks, {
      issuer: Array.from(GOOGLE_ISSUERS),
      audience: env.googleClientId
    });
    return mapGooglePayload(payload as GoogleJwtPayload);
  }

  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokens.access_token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Google user info lookup failed: ${response.statusText}`);
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return mapGooglePayload({
    sub: typeof payload.sub === "string" ? payload.sub : undefined,
    email: typeof payload.email === "string" ? payload.email : undefined,
    email_verified:
      typeof payload.email_verified === "boolean" ? payload.email_verified : undefined,
    name: typeof payload.name === "string" ? payload.name : undefined,
    picture: typeof payload.picture === "string" ? payload.picture : undefined,
    given_name: typeof payload.given_name === "string" ? payload.given_name : undefined,
    family_name: typeof payload.family_name === "string" ? payload.family_name : undefined,
    iss: typeof payload.iss === "string" ? payload.iss : undefined,
    aud: typeof payload.aud === "string" || Array.isArray(payload.aud) ? (payload.aud as string | string[]) : undefined
  });
}

export async function createAvailableGoogleUsername(input: {
  email: string;
  name: string;
  isTaken: (username: string) => Promise<boolean>;
}) {
  const emailBase = normalizeEmail(input.email).split("@")[0] ?? "";
  const base = makeUsernameCandidate(input.name || emailBase || "nubiuser");

  for (let index = 0; index < 1000; index += 1) {
    const suffix = index === 0 ? "" : String(index + 1);
    const trimmedBase = base.slice(0, Math.max(3, 24 - suffix.length));
    const candidate = `${trimmedBase}${suffix}`;
    if (!(await input.isTaken(candidate))) {
      return candidate;
    }
  }

  return `${base.slice(0, 18)}${crypto.randomUUID().slice(0, 6)}`;
}

function mapGooglePayload(payload: GoogleJwtPayload): GoogleIdentity {
  if (!payload.sub || !payload.email) {
    throw new Error("Google identity payload was missing required fields.");
  }

  if (!GOOGLE_ISSUERS.has(payload.iss ?? "https://accounts.google.com")) {
    throw new Error("Google identity issuer was invalid.");
  }

  return {
    sub: payload.sub,
    email: normalizeEmail(payload.email),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name?.trim() || payload.email.split("@")[0] || "NOMI User",
    picture: payload.picture ?? null,
    givenName: payload.given_name ?? null,
    familyName: payload.family_name ?? null
  };
}

async function safeJson(response: Response) {
  try {
    return (await response.json()) as Record<string, string>;
  } catch {
    return {};
  }
}

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildGoogleAuthUrl, isGoogleAuthConfigured } from "@/lib/auth/google";
import { buildAuthRedirectUrl, sanitizeAuthNextPath } from "@/lib/auth/redirect";
import { shouldUseSecureCookies } from "@/lib/config/env";

const STATE_COOKIE = "nubi_google_oauth_state";
const NEXT_COOKIE = "nubi_google_oauth_next";
const MODE_COOKIE = "nubi_google_oauth_mode";

export async function GET(request: Request) {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.redirect(buildErrorUrl(request, "Google sign-in is not configured.", "login"));
  }

  const url = new URL(request.url);
  const nextPath = sanitizeAuthNextPath(url.searchParams.get("next"));
  const mode = sanitizeMode(url.searchParams.get("mode"));
  const state = crypto.randomUUID();
  const cookieStore = await cookies();

  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/",
    maxAge: 10 * 60
  };

  cookieStore.set(STATE_COOKIE, state, cookieOptions);
  cookieStore.set(NEXT_COOKIE, nextPath, cookieOptions);
  cookieStore.set(MODE_COOKIE, mode, cookieOptions);

  return NextResponse.redirect(buildGoogleAuthUrl({ state }));
}

function buildErrorUrl(request: Request, message: string, mode: "login" | "signup") {
  return buildAuthRedirectUrl({
    request,
    pathname: `/${mode}`,
    searchParams: { error: message }
  });
}

function sanitizeMode(value: string | null): "login" | "signup" {
  return value === "signup" ? "signup" : "login";
}

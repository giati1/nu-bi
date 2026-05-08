import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { buildAuthRedirectUrl, sanitizeAuthNextPath } from "@/lib/auth/redirect";
import { createAuthSession } from "@/lib/auth/session";
import {
  createAvailableGoogleUsername,
  exchangeGoogleCode,
  isGoogleAuthConfigured,
  resolveGoogleIdentity
} from "@/lib/auth/google";
import { hashPassword } from "@/lib/auth/password";
import {
  createUser,
  getUserByEmail,
  getUserByOauthAccount,
  getUserByUsername,
  linkOauthAccount
} from "@/lib/db/repository";
import { shouldUseSecureCookies } from "@/lib/config/env";

const STATE_COOKIE = "nubi_google_oauth_state";
const NEXT_COOKIE = "nubi_google_oauth_next";
const MODE_COOKIE = "nubi_google_oauth_mode";
const GOOGLE_PROVIDER = "google";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const cookieStore = await cookies();
  const mode = readMode(cookieStore.get(MODE_COOKIE)?.value);
  const nextPath = sanitizeAuthNextPath(cookieStore.get(NEXT_COOKIE)?.value);
  const clearOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: shouldUseSecureCookies(),
    path: "/"
  };

  try {
    if (!isGoogleAuthConfigured()) {
      return redirectWithError(request, mode, "Google sign-in is not configured.");
    }

    const expectedState = cookieStore.get(STATE_COOKIE)?.value;
    const receivedState = requestUrl.searchParams.get("state");
    const code = requestUrl.searchParams.get("code");
    const oauthError = requestUrl.searchParams.get("error");

    if (oauthError) {
      return redirectWithError(request, mode, `Google sign-in failed: ${oauthError}.`);
    }

    if (!expectedState || !receivedState || expectedState !== receivedState || !code) {
      return redirectWithError(request, mode, "Google sign-in could not be verified.");
    }

    const tokens = await exchangeGoogleCode(code);
    const identity = await resolveGoogleIdentity(tokens);

    if (!identity.emailVerified) {
      return redirectWithError(request, mode, "Google account email must be verified.");
    }

    let user = await getUserByOauthAccount(GOOGLE_PROVIDER, identity.sub);
    if (!user) {
      user = await getUserByEmail(identity.email);
    }

    if (!user) {
      const username = await createAvailableGoogleUsername({
        email: identity.email,
        name: identity.name,
        isTaken: async (candidate) => Boolean(await getUserByUsername(candidate))
      });
      const passwordHash = await hashPassword(crypto.randomUUID());
      user = await createUser({
        email: identity.email,
        username,
        displayName: identity.name,
        passwordHash
      });
    }

    if (!user) {
      return redirectWithError(request, mode, "Failed to create a Google-linked account.");
    }

    await linkOauthAccount({
      userId: user.id,
      provider: GOOGLE_PROVIDER,
      providerAccountId: identity.sub,
      providerEmail: identity.email
    });
    await createAuthSession(user.id);

    const response = NextResponse.redirect(
      buildAuthRedirectUrl({
        request,
        pathname: nextPath
      })
    );
    response.cookies.delete(STATE_COOKIE);
    response.cookies.delete(NEXT_COOKIE);
    response.cookies.delete(MODE_COOKIE);
    return response;
  } catch (error) {
    console.error("[auth] Google callback failed", {
      requestUrl: request.url,
      mode,
      nextPath,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return redirectWithError(request, mode, "Google sign-in failed. Please try again.");
  } finally {
    cookieStore.set(STATE_COOKIE, "", { ...clearOptions, maxAge: 0 });
    cookieStore.set(NEXT_COOKIE, "", { ...clearOptions, maxAge: 0 });
    cookieStore.set(MODE_COOKIE, "", { ...clearOptions, maxAge: 0 });
  }
}

function redirectWithError(request: Request, mode: "login" | "signup", message: string) {
  return NextResponse.redirect(
    buildAuthRedirectUrl({
      request,
      pathname: `/${mode}`,
      searchParams: { error: message }
    })
  );
}

function readMode(value: string | null | undefined): "login" | "signup" {
  return value === "signup" ? "signup" : "login";
}

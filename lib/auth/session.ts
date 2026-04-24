import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { env, shouldUseSecureCookies } from "@/lib/config/env";
import {
  createSession,
  deleteSessionById,
  getUserBySessionToken
} from "@/lib/db/repository";

export async function createAuthSession(userId: string) {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + env.sessionMaxAgeDays * 24 * 60 * 60 * 1000).toISOString();
  try {
    await createSession({
      id: sessionId,
      userId,
      expiresAt
    });
  } catch (error) {
    console.error("[auth] failed to create local session", {
      userId,
      ...getErrorDetails(error)
    });
    throw error;
  }
  const cookieStore = await cookies();
  cookieStore.set(env.sessionCookieName, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookies(),
    path: "/",
    expires: new Date(expiresAt)
  });
}

export async function clearAuthSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (token) {
    await deleteSessionById(token);
  }
  cookieStore.delete(env.sessionCookieName);
}

export async function getViewer() {
  const cookieStore = await cookies();
  const token = cookieStore.get(env.sessionCookieName)?.value;
  if (!token) {
    return null;
  }
  return await getUserBySessionToken(token);
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer) {
    throw new Error("UNAUTHORIZED");
  }
  return viewer;
}

export async function requirePageViewer(nextPath: string) {
  const viewer = await getViewer();
  if (viewer) {
    return viewer;
  }

  const destination = new URLSearchParams({ next: nextPath });
  redirect(`/login?${destination.toString()}`);
}

function getErrorDetails(error: unknown) {
  if (!(error instanceof Error)) {
    return { message: "Unknown error" };
  }

  const sqliteError = error as Error & { code?: string; errno?: number };
  return {
    code: sqliteError.code,
    errno: sqliteError.errno,
    message: error.message
  };
}

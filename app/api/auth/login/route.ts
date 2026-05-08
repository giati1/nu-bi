import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getUserWithPasswordByEmail, getUserWithPasswordByUsername } from "@/lib/db/repository";
import { normalizeEmail, normalizeUsername } from "@/lib/identity";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.parse(await request.json());
    const normalizedEmail = normalizeEmail(parsed.email);
    const normalizedUsername = normalizeUsername(parsed.email);
    const user =
      (await getUserWithPasswordByEmail(normalizedEmail)) ??
      (await getUserWithPasswordByUsername(normalizedUsername));

    if (!user) {
      console.warn("[auth] login failed: user not found", {
        email: normalizedEmail,
        usernameFallback: normalizedUsername
      });
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.password, user.password_hash);
    if (!valid) {
      console.warn("[auth] login failed: password mismatch", {
        attemptedEmail: normalizedEmail,
        matchedUserId: user.id,
        matchedEmail: user.email,
        matchedUsername: user.username
      });
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    await createAuthSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

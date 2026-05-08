import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db/repository";
import { makeUsernameCandidate, normalizeEmail, normalizeUsername } from "@/lib/identity";
import { signupSchema } from "@/lib/validators";
import { z } from "zod";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
    const parsed = signupSchema.parse(body);
    const email = normalizeEmail(parsed.email);
    const username = normalizeUsername(parsed.username);

    const [emailTaken, usernameTaken] = await Promise.all([
      getUserByEmail(email),
      getUserByUsername(username)
    ]);

    if (emailTaken) {
      return NextResponse.json(
        { error: "That email is already being used. Try logging in instead." },
        { status: 409 }
      );
    }
    if (usernameTaken) {
      const suggestion = await findAvailableUsernameSuggestion(username);

      return NextResponse.json(
        {
          error: "That username is taken.",
          suggestion
        },
        { status: 409 }
      );
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await createUser({
      email,
      username,
      displayName: parsed.displayName,
      passwordHash
    });

    if (!user) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
    }

    await createAuthSession(user.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const usernameInput = getUsernameInput(body);
      const suggestion = usernameInput ? makeUsernameCandidate(usernameInput) : null;

      return NextResponse.json(
        {
          error: error.issues[0]?.message ?? "Invalid signup details.",
          suggestion:
            suggestion && suggestion.length >= 3 && suggestion !== normalizeUsername(usernameInput ?? "")
              ? suggestion
              : null
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status: 400 }
    );
  }
}

function getUsernameInput(body: unknown) {
  if (!body || typeof body !== "object") {
    return null;
  }

  const input = "username" in body && typeof body.username === "string" ? body.username : null;

  return input?.trim() ? input : null;
}

async function findAvailableUsernameSuggestion(username: string) {
  const base = makeUsernameCandidate(username);
  if (!base) {
    return null;
  }

  if (!(await getUserByUsername(base))) {
    return base;
  }

  for (let index = 2; index <= 25; index += 1) {
    const suffix = String(index);
    const candidate = `${base.slice(0, 24 - suffix.length)}${suffix}`;
    if (!(await getUserByUsername(candidate))) {
      return candidate;
    }
  }

  return null;
}

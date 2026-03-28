import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/password";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db/repository";
import { signupSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const parsed = signupSchema.parse(await request.json());

    const [emailTaken, usernameTaken] = await Promise.all([
      getUserByEmail(parsed.email),
      getUserByUsername(parsed.username)
    ]);

    if (emailTaken) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }
    if (usernameTaken) {
      return NextResponse.json({ error: "Username already in use." }, { status: 409 });
    }

    const passwordHash = await hashPassword(parsed.password);
    const user = await createUser({
      email: parsed.email,
      username: parsed.username.toLowerCase(),
      displayName: parsed.displayName,
      passwordHash
    });

    if (!user) {
      return NextResponse.json({ error: "Failed to create user." }, { status: 500 });
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

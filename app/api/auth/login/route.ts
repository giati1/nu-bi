import { NextResponse } from "next/server";
import { createAuthSession } from "@/lib/auth/session";
import { verifyPassword } from "@/lib/auth/password";
import { getUserWithPasswordByEmail } from "@/lib/db/repository";
import { loginSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const parsed = loginSchema.parse(await request.json());
    const user = await getUserWithPasswordByEmail(parsed.email);

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const valid = await verifyPassword(parsed.password, user.password_hash);
    if (!valid) {
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

import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { updateProfile } from "@/lib/db/repository";
import { profileUpdateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = profileUpdateSchema.parse(await request.json());
    const user = await updateProfile({
      userId: viewer.id,
      username: parsed.username,
      displayName: parsed.displayName,
      bio: parsed.bio,
      website: parsed.website || null,
      location: parsed.location || null,
      avatarUrl: parsed.avatarUrl || null,
      isPrivate: parsed.isPrivate
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update profile." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { getUserInterests, setUserInterest } from "@/lib/db/repository";
import { interestSchema } from "@/lib/validators";

export async function GET() {
  try {
    const viewer = await requireViewer();
    return NextResponse.json({ interests: await getUserInterests(viewer.id) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to load interests." }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const viewer = await requireViewer();
    const parsed = interestSchema.parse(await request.json());
    await setUserInterest(viewer.id, parsed.interest.trim().toLowerCase(), parsed.enabled);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save interest." }, { status: 400 });
  }
}

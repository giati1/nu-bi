import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { assertCompanionPrototypeAccess } from "@/lib/companions/access";
import { createCompanion, listCompanions } from "@/lib/companions/repository";

const createSchema = z.object({
  name: z.string().trim().min(2).max(50),
  personality: z.string().trim().min(8).max(600),
  appearance: z.string().trim().min(8).max(600),
  adultAcknowledged: z.literal(true),
  characterConfirmed: z.literal(true)
});

export async function GET() {
  try {
    assertCompanionPrototypeAccess();
    const viewer = await requireViewer();
    return NextResponse.json({ companions: await listCompanions(viewer.id) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertCompanionPrototypeAccess();
    const viewer = await requireViewer();
    const input = createSchema.parse(await request.json());
    const existing = await listCompanions(viewer.id);
    if (existing.length >= 10) return NextResponse.json({ error: "The prototype supports up to 10 companions." }, { status: 429 });
    const companion = await createCompanion(viewer.id, input);
    return NextResponse.json({ companion }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}

function apiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Companion request failed.";
  const status = message === "UNAUTHORIZED" ? 401 : message.includes("not available in production") ? 404 : 400;
  return NextResponse.json({ error: message }, { status });
}

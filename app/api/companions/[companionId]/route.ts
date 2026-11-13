import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { assertCompanionPrototypeAccess } from "@/lib/companions/access";
import { deleteCompanion, getCompanion, listMessages } from "@/lib/companions/repository";

export async function GET(_request: Request, { params }: { params: { companionId: string } }) {
  try {
    assertCompanionPrototypeAccess();
    const viewer = await requireViewer();
    const companion = await getCompanion(viewer.id, params.companionId);
    if (!companion) return NextResponse.json({ error: "Companion not found." }, { status: 404 });
    return NextResponse.json({ companion, messages: await listMessages(viewer.id, companion.id) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load companion.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 404 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { companionId: string } }) {
  try {
    assertCompanionPrototypeAccess();
    const viewer = await requireViewer();
    const deleted = await deleteCompanion(viewer.id, params.companionId);
    return NextResponse.json({ deleted }, { status: deleted ? 200 : 404 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not delete companion.";
    return NextResponse.json({ error: message }, { status: message === "UNAUTHORIZED" ? 401 : 404 });
  }
}

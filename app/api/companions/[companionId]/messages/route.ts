import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { assertCompanionPrototypeAccess } from "@/lib/companions/access";
import { generateCompanionReply } from "@/lib/companions/provider";
import { getCompanion, listMessages, saveMessage } from "@/lib/companions/repository";

const schema = z.object({ body: z.string().trim().min(1).max(2000), adultAcknowledged: z.literal(true) });

export async function POST(request: Request, { params }: { params: { companionId: string } }) {
  try {
    assertCompanionPrototypeAccess();
    const viewer = await requireViewer();
    const input = schema.parse(await request.json());
    const companion = await getCompanion(viewer.id, params.companionId);
    if (!companion) return NextResponse.json({ error: "Companion not found." }, { status: 404 });
    if (!process.env.COMPANION_OLLAMA_MODEL?.trim()) {
      return NextResponse.json({ error: "Set COMPANION_OLLAMA_MODEL in .env.local to enable local companion chat." }, { status: 503 });
    }
    const userMessage = await saveMessage(viewer.id, companion.id, "user", input.body);
    const history = await listMessages(viewer.id, companion.id);
    const reply = await generateCompanionReply(companion, history);
    const assistantMessage = await saveMessage(viewer.id, companion.id, "assistant", reply);
    return NextResponse.json({ userMessage, assistantMessage });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send message.";
    const status = message === "UNAUTHORIZED" ? 401 : message.includes("not available in production") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

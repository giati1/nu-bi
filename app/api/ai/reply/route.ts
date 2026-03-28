import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { getAIAdapter } from "@/lib/ai";

const schema = z.object({
  body: z.string().max(1000),
  intent: z.string().min(2).max(40)
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const reply = await getAIAdapter().suggestReply(parsed);
    return NextResponse.json({ reply });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate reply." }, { status: 400 });
  }
}

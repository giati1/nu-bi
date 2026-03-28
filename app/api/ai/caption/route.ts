import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { getAIAdapter } from "@/lib/ai";

const schema = z.object({
  body: z.string().max(500),
  vibe: z.string().min(2).max(40)
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const caption = await getAIAdapter().suggestCaption(parsed);
    return NextResponse.json({ caption });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate caption." }, { status: 400 });
  }
}

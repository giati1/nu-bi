import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { getAIAdapter } from "@/lib/ai";

const schema = z.object({
  prompt: z.string().min(4).max(300),
  style: z.string().min(2).max(40)
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const image = await getAIAdapter().generateImage(parsed);
    return NextResponse.json(image);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate image." }, { status: 400 });
  }
}

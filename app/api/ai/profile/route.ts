import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { getAIAdapter } from "@/lib/ai";

const schema = z.object({
  displayName: z.string().min(2).max(50),
  bio: z.string().max(240),
  website: z.string().optional().nullable(),
  location: z.string().optional().nullable(),
  vibe: z.string().min(2).max(40).default("premium")
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());
    const profile = await getAIAdapter().rewriteProfile(parsed);
    return NextResponse.json(profile);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to rewrite profile." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth/password";
import { requireInternalAdminViewer } from "@/lib/auth/internal";
import { ensurePlatformAIAgentBySlug } from "@/lib/ai-agents/bootstrap";

export async function POST(request: Request) {
  try {
    await requireInternalAdminViewer();
    const payload = (await request.json().catch(() => ({}))) as { slug?: string };
    const slug = payload.slug?.trim() || "nomi-host";
    const passwordHash = await hashPassword(crypto.randomUUID());
    const agent = await ensurePlatformAIAgentBySlug(slug, passwordHash);
    return NextResponse.json({ agent });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to bootstrap AI agent." },
      { status: 400 }
    );
  }
}

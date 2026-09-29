import { NextResponse } from "next/server";
import { get, run } from "@/lib/db/client";
import { publicWorldSchema } from "@/lib/ai-world/schema";
import { createHash, timingSafeEqual } from "node:crypto";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const row = await get<{ payload: string; published_at: string }>("SELECT payload, published_at FROM ai_world_snapshot WHERE id = 'public'");
    return NextResponse.json(row ? { ...JSON.parse(row.payload), publishedAt: row.published_at } : null, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "World data is temporarily unavailable." }, { status: 503 });
  }
}

// Dedicated publisher credential: this endpoint cannot control models or publish social posts.
export async function POST(request: Request) {
  const expected = process.env.NOMI_WORLD_PUBLISH_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer /, "") || "";
  if (!expected || !timingSafeEqual(createHash("sha256").update(expected).digest(), createHash("sha256").update(provided).digest())) {
    return NextResponse.json({ error: "Unauthorized publisher." }, { status: 401 });
  }
  try {
    const reader = request.body?.getReader();
    if (!reader) return NextResponse.json({ error: "Missing payload." }, { status: 400 });
    let bytes = 0;
    const decoder = new TextDecoder();
    let text = "";
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1500000) { await reader.cancel(); return NextResponse.json({ error: "Payload too large." }, { status: 413 }); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    const parsed = publicWorldSchema.safeParse(JSON.parse(text));
    if (!parsed.success) return NextResponse.json({ error: "Invalid public world payload." }, { status: 400 });
    const publishedAt = new Date().toISOString();
    await run("INSERT INTO ai_world_snapshot (id, payload, published_at) VALUES ('public', ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, published_at = excluded.published_at", [JSON.stringify(parsed.data), publishedAt]);
    return NextResponse.json({ publishedAt });
  } catch {
    return NextResponse.json({ error: "Could not publish world snapshot." }, { status: 500 });
  }
}

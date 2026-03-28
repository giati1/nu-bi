import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { searchAll } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();
    if (!q) {
      return NextResponse.json({ users: [], posts: [] });
    }
    const results = await searchAll(q, viewer.id);
    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed." },
      { status: 400 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireViewer } from "@/lib/auth/session";
import { createOrGetDirectConversation } from "@/lib/db/repository";

export async function GET(request: Request) {
  try {
    const viewer = await requireViewer();
    const url = new URL(request.url);
    const recipientId = url.searchParams.get("recipientId")?.trim() ?? "";

    if (!recipientId) {
      return NextResponse.redirect(new URL("/messages", request.url));
    }

    const conversationId = await createOrGetDirectConversation(viewer.id, recipientId);
    return NextResponse.redirect(new URL(`/messages/${conversationId}`, request.url));
  } catch {
    return NextResponse.redirect(new URL("/login?next=/ai-tools", request.url));
  }
}

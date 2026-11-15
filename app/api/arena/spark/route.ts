import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchArenaSparkToLocalAI } from "@/lib/ai-agents/arena-dispatcher";

const sparkSchema = z.object({
  topic: z.string().max(320).nullable().optional(),
  agentSlug: z
    .enum([
      "kairosterling",
      "sorenvale",
      "marcusvance",
      "elenarostova",
      "jaxmercer",
      "nova_tech",
      "nova_director",
      "nova_hype",
      "nova_purist",
      "nova_advocate",
      "nubi"
    ])
    .optional()
});

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = sparkSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const dispatched = await dispatchArenaSparkToLocalAI({
      topic: parsed.data.topic ?? null,
      agentSlug: parsed.data.agentSlug ?? "sorenvale"
    });

    return NextResponse.json({
      ok: dispatched,
      message: dispatched
        ? "New topic wave launched into the feed."
        : "Pulse service is temporarily busy."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to start topic wave." },
      { status: 500 }
    );
  }
}

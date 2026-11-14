import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchArenaSparkToLocalAI } from "@/lib/ai-agents/arena-dispatcher";

const sparkSchema = z.object({
  topic: z.string().max(240).nullable().optional(),
  agentSlug: z
    .enum(["nova_director", "nova_hype", "nova_purist", "nova_advocate", "nubi"])
    .optional()
});

export async function POST(request: Request) {
  try {
    const raw = await request.json().catch(() => ({}));
    const parsed = sparkSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid spark request." }, { status: 400 });
    }

    const dispatched = await dispatchArenaSparkToLocalAI({
      topic: parsed.data.topic ?? null,
      agentSlug: parsed.data.agentSlug ?? "nova_director"
    });

    return NextResponse.json({
      ok: dispatched,
      message: dispatched
        ? "Nova Executive Director is drafting a new Arena debate and summoning 2 personas."
        : "Nova local multiplexer was unreachable."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to spark debate." },
      { status: 500 }
    );
  }
}

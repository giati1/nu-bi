import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchNewPostToLocalAI } from "@/lib/ai-agents/arena-dispatcher";
import { getPostById } from "@/lib/db/repository";

const summonSchema = z.object({
  postId: z.string().min(1),
  personaSlug: z
    .enum(["nova_hype", "nova_purist", "nova_advocate", "nova_director"])
    .nullable()
    .optional(),
  singlePersona: z.boolean().optional()
});

export async function POST(request: Request) {
  try {
    const raw = await request.json();
    const parsed = summonSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid summon payload.", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const post = await getPostById(parsed.data.postId, "");
    if (!post) {
      return NextResponse.json({ error: "Post not found." }, { status: 404 });
    }

    dispatchNewPostToLocalAI(post, {
      targetPersonaSlug: parsed.data.personaSlug ?? null,
      singlePersona: Boolean(parsed.data.singlePersona)
    });

    return NextResponse.json({
      ok: true,
      postId: post.id,
      personaSlug: parsed.data.personaSlug ?? "crossfire",
      message: "Nova AI Personas have been dispatched to this thread."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to summon AI persona." },
      { status: 500 }
    );
  }
}

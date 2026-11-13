import { NextResponse } from "next/server";
import { z } from "zod";
import { sendAgentDirectMessage } from "@/lib/ai-agents/chat";
import { requireInternalAdminViewer } from "@/lib/auth/internal";

const schema = z
  .object({
    recipientUsername: z.string().trim().min(3).max(24),
    body: z.string().trim().max(1000).optional().nullable(),
    prompt: z.string().trim().max(1000).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (!value.body?.trim() && !value.prompt?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Provide a direct message or a prompt."
      });
    }
  });

export async function POST(
  request: Request,
  { params }: { params: { agentId: string } }
) {
  try {
    await requireInternalAdminViewer();
    const parsed = schema.parse(await request.json());
    const result = await sendAgentDirectMessage({
      agentId: params.agentId,
      recipientUsername: parsed.recipientUsername,
      body: parsed.body ?? null,
      prompt: parsed.prompt ?? null
    });
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send agent message." },
      { status: 400 }
    );
  }
}

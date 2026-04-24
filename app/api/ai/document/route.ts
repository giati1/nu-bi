import { NextResponse } from "next/server";
import { z } from "zod";
import { requireViewer } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

const schema = z.object({
  task: z.string().min(4).max(400),
  text: z.string().max(20000).nullable().optional(),
  imageDataUrl: z.string().max(12_000_000).nullable().optional()
});

export async function POST(request: Request) {
  try {
    await requireViewer();
    const parsed = schema.parse(await request.json());

    if (!parsed.text?.trim() && !parsed.imageDataUrl?.trim()) {
      return NextResponse.json({ error: "Add a document image or text file first." }, { status: 400 });
    }

    if (parsed.imageDataUrl && !parsed.imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Use an image for document scan." }, { status: 400 });
    }

    if (!env.openAiApiKey) {
      if (parsed.text?.trim()) {
        return NextResponse.json({
          result: buildFallbackDocumentResult(parsed.task, parsed.text)
        });
      }

      return NextResponse.json({ error: "Document reading is not configured." }, { status: 400 });
    }

    const response = await fetch(`${env.openAiBaseUrl}/responses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openAiApiKey}`
      },
      body: JSON.stringify({
        model: env.openAiTextModel,
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "You are NU-BI AI. Read documents clearly and helpfully. Never mention provider names, model names, APIs, or backend vendors. Return plain text only."
              }
            ]
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: [
                  `Task: ${parsed.task}`,
                  parsed.text?.trim() ? `Document text:\n${parsed.text.trim()}` : "Read the attached document image."
                ].join("\n\n")
              },
              ...(parsed.imageDataUrl
                ? [
                    {
                      type: "input_image",
                      image_url: parsed.imageDataUrl,
                      detail: "high"
                    }
                  ]
                : [])
            ]
          }
        ]
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      const payload = await response.text();
      return NextResponse.json({ error: payload || "Document reading failed." }, { status: 400 });
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const result = extractOutputText(payload);

    return NextResponse.json({
      result: result || "The document was read, but no summary was returned."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Document reading failed." },
      { status: 400 }
    );
  }
}

function extractOutputText(response: Record<string, unknown>) {
  const outputText = response.output_text;
  if (typeof outputText === "string" && outputText.trim()) {
    return outputText.trim();
  }

  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content?: unknown[] }).content as Array<Record<string, unknown>>)
      : [];

    for (const part of content) {
      if (typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "";
}

function buildFallbackDocumentResult(task: string, text: string) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const preview = lines.slice(0, 8).join("\n");

  return [
    `Task: ${task}`,
    "",
    "Quick read:",
    preview || text.slice(0, 500),
    "",
    "Add an AI key to get a fuller document summary from scanned pages."
  ].join("\n");
}

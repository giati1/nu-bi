import type { NuBiAIAdapter } from "@/lib/ai/contracts";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini";

const fallbackAdapter: NuBiAIAdapter = {
  async rankFeed(context) {
    return context.candidatePostIds;
  },
  async analyzePost({ postId, body }) {
    return {
      postId,
      length: body.length,
      tags: []
    };
  },
  async scoreModeration({ body }) {
    const flags = ["spam", "threat", "self-harm"].filter((term) =>
      body.toLowerCase().includes(term)
    );
    return {
      score: flags.length > 0 ? 0.8 : 0.05,
      labels: flags
    };
  },
  async analyzeMessageTone({ conversationId, body }) {
    return {
      conversationId,
      sentiment: body.includes("!") ? "high-energy" : "neutral"
    };
  },
  async suggestCaption({ body, vibe }) {
    const trimmed = body.trim();
    if (!trimmed) {
      return `Minimal ${vibe} drop. Built to start a conversation.`;
    }
    return `${trimmed}\n\nVibe: ${vibe}. Clear signal, strong point of view, and one clean takeaway.`;
  },
  async suggestReply({ intent }) {
    if (intent === "supportive") {
      return `Strong point. The clearest next step is to push this into product behavior, not just talk about it.`;
    }
    if (intent === "curious") {
      return `Interesting angle. What signal made you most confident this direction will actually compound?`;
    }
    return `I see the argument. The part worth pressure-testing is execution quality and whether users feel the difference immediately.`;
  },
  async rewriteProfile({ displayName, bio, website, location, vibe }) {
    const cleanName = displayName.trim() || "NOMI user";
    const cleanBio = bio.trim();
    const sitePart = website ? ` Building from ${website.replace(/^https?:\/\//, "")}.` : "";
    const locationPart = location ? ` Based in ${location}.` : "";
    return {
      displayName: cleanName,
      bio:
        cleanBio ||
        `${cleanName} is shaping a ${vibe} presence on NOMI.${sitePart}${locationPart} Focused, credible, and easy to remember.`
    };
  },
  async summarizeInbox({ ownerDisplayName, conversations }) {
    if (conversations.length === 0) {
      return {
        headline: `${ownerDisplayName}, your inbox is clear right now.`,
        bullets: ["No active threads yet. Start a conversation from a profile to build your network."]
      };
    }
    const unreadThreads = conversations.filter((conversation) => conversation.unreadCount > 0);
    const hottest = conversations.slice(0, 3).map((conversation) => {
      const preview = conversation.lastMessage?.slice(0, 90) ?? "No message yet";
      return `${conversation.counterpart}: ${preview}`;
    });
    return {
      headline:
        unreadThreads.length > 0
          ? `${unreadThreads.length} thread${unreadThreads.length === 1 ? "" : "s"} need attention.`
          : "All caught up. Your latest conversations are still within reach.",
      bullets: [
        ...hottest,
        unreadThreads.length > 0
          ? `Unread priority: ${unreadThreads
              .slice(0, 2)
              .map((conversation) => conversation.counterpart)
              .join(" and ")}`
          : "No unread messages right now."
      ]
    };
  },
  async generateImage({ prompt, style }) {
    const title = escapeSvg(`${style.toUpperCase()}`);
    const text = escapeSvg(prompt.slice(0, 120));
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="1200" viewBox="0 0 1200 1200">
        <defs>
          <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stop-color="#120505"/>
            <stop offset="52%" stop-color="#7f1d1d"/>
            <stop offset="100%" stop-color="#050505"/>
          </linearGradient>
          <radialGradient id="glow" cx="35%" cy="25%" r="45%">
            <stop offset="0%" stop-color="#ef4444" stop-opacity="0.9"/>
            <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="1200" height="1200" fill="url(#bg)"/>
        <rect width="1200" height="1200" fill="url(#glow)"/>
        <circle cx="940" cy="220" r="180" fill="#ffffff" fill-opacity="0.06"/>
        <circle cx="250" cy="900" r="220" fill="#ef4444" fill-opacity="0.12"/>
        <text x="90" y="140" fill="#fca5a5" font-size="42" font-family="Arial, sans-serif" letter-spacing="8">${title}</text>
        <foreignObject x="90" y="240" width="1020" height="760">
          <div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font-family:Arial,sans-serif;font-size:72px;line-height:1.08;font-weight:700;">
            ${text}
          </div>
        </foreignObject>
      </svg>
    `.trim();
    return {
      prompt,
      url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
    };
  }
};

const openAIAdapter: NuBiAIAdapter = {
  async rankFeed(context) {
    return fallbackAdapter.rankFeed(context);
  },
  async analyzePost(input) {
    return fallbackAdapter.analyzePost(input);
  },
  async scoreModeration(input) {
    return fallbackAdapter.scoreModeration(input);
  },
  async analyzeMessageTone(input) {
    return fallbackAdapter.analyzeMessageTone(input);
  },
  async suggestCaption({ body, vibe }) {
    const text = await createTextCompletion(
      [
        "You write premium social captions for a polished startup product.",
        "Return one concise caption only. No bullets, no quotation marks."
      ].join(" "),
      `Draft or rewrite this caption in a ${vibe} tone:\n${body || "(blank draft)"}`
    );
    return text || fallbackAdapter.suggestCaption({ body, vibe });
  },
  async suggestReply({ body, intent }) {
    const text = await createTextCompletion(
      [
        "You write short, sharp social and messaging replies.",
        `Intent: ${intent}.`,
        "Return one reply only. No labels or bullets."
      ].join(" "),
      `Reply to this message or comment:\n${body || "(blank draft)"}`
    );
    return text || fallbackAdapter.suggestReply({ body, intent });
  },
  async rewriteProfile({ displayName, bio, website, location, vibe }) {
    const text = await createTextCompletion(
      [
        "You improve social profile bios for a premium product.",
        "Return strict JSON with keys displayName and bio."
      ].join(" "),
      JSON.stringify({ displayName, bio, website, location, vibe })
    );
    const parsed = parseJson<{ displayName: string; bio: string }>(text);
    return parsed ?? fallbackAdapter.rewriteProfile({ displayName, bio, website, location, vibe });
  },
  async summarizeInbox({ ownerDisplayName, conversations }) {
    const text = await createTextCompletion(
      [
        "You summarize a social inbox for a founder or creator.",
        "Return strict JSON with keys headline and bullets.",
        "bullets must be an array of 3 short strings."
      ].join(" "),
      JSON.stringify({ ownerDisplayName, conversations })
    );
    const parsed = parseJson<{ headline: string; bullets: string[] }>(text);
    return parsed ?? fallbackAdapter.summarizeInbox({ ownerDisplayName, conversations });
  },
  async generateImage({ prompt, style }) {
    const image = await createImage(prompt, style);
    return image ?? fallbackAdapter.generateImage({ prompt, style });
  }
};

export function getAIAdapter(): NuBiAIAdapter {
  return OPENAI_API_KEY ? openAIAdapter : fallbackAdapter;
}

async function createTextCompletion(instructions: string, input: string) {
  const response = await callOpenAI({
    model: OPENAI_TEXT_MODEL,
    input: [
      {
        role: "system",
        content: [{ type: "input_text", text: instructions }]
      },
      {
        role: "user",
        content: [{ type: "input_text", text: input }]
      }
    ]
  });

  return extractOutputText(response);
}

async function createImage(prompt: string, style: string) {
  const modelsToTry = Array.from(
    new Set([OPENAI_IMAGE_MODEL, "gpt-image-1-mini", "gpt-4o-mini"])
  );

  for (const model of modelsToTry) {
    try {
      const image =
        model.startsWith("gpt-image-1")
          ? await createImageWithImagesApi(prompt, style, model)
          : await createImageWithResponsesApi(prompt, style, model);

      if (image) {
        return image;
      }
    } catch (error) {
      if (!shouldRetryImageModel(error)) {
        throw error;
      }
    }
  }

  return null;
}

async function callOpenAI(body: Record<string, unknown>) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch(`${OPENAI_BASE_URL}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "OpenAI request failed.");
  }

  return (await response.json()) as Record<string, unknown>;
}

async function callOpenAIImages(body: Record<string, unknown>) {
  if (!OPENAI_API_KEY) {
    return null;
  }

  const response = await fetch(`${OPENAI_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify(body),
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(payload || "OpenAI image request failed.");
  }

  return (await response.json()) as Record<string, unknown>;
}

async function createImageWithResponsesApi(prompt: string, style: string, model: string) {
  const response = await callOpenAI({
    model,
    input: `Generate a polished social media image in a ${style} style. Prompt: ${prompt}`,
    tools: [{ type: "image_generation" }]
  });

  if (!response) {
    return null;
  }

  const output = Array.isArray(response.output)
    ? (response.output as Array<{
        result?: string;
        content?: Array<{ type?: string; b64_json?: string }>;
      }>)
    : [];
  const imageBase64 =
    output
      .flatMap((item) => {
        if (item.result) {
          return [item.result];
        }
        if (item.content) {
          return item.content
            .filter((content) => content.type === "output_image" && content.b64_json)
            .map((content) => content.b64_json as string);
        }
        return [];
      })
      .find(Boolean) ?? null;

  if (!imageBase64) {
    return null;
  }

  return {
    prompt,
    url: `data:image/png;base64,${imageBase64}`
  };
}

async function createImageWithImagesApi(prompt: string, style: string, model: string) {
  const response = await callOpenAIImages({
    model,
    prompt: `Create a polished social media image in a ${style} style. ${prompt}`,
    size: "1024x1024"
  });

  if (!response) {
    return null;
  }

  const data = Array.isArray(response.data)
    ? (response.data as Array<{ b64_json?: string }>)
    : [];
  const imageBase64 = data.find((item) => item.b64_json)?.b64_json ?? null;

  if (!imageBase64) {
    return null;
  }

  return {
    prompt,
    url: `data:image/png;base64,${imageBase64}`
  };
}

function extractOutputText(response: Record<string, unknown> | null) {
  if (!response) {
    return "";
  }
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

function shouldRetryImageModel(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("must be verified") ||
    message.includes("does not have access") ||
    message.includes("unsupported model") ||
    message.includes("invalid model")
  );
}

function parseJson<T>(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const direct = tryParseJson<T>(trimmed);
  if (direct) {
    return direct;
  }
  const match = trimmed.match(/\{[\s\S]*\}/);
  if (!match) {
    return null;
  }
  return tryParseJson<T>(match[0]);
}

function tryParseJson<T>(value: string) {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

function escapeSvg(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

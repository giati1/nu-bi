import type { AgentGeneratedContent, NuBiAIAdapter } from "@/lib/ai/contracts";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const OPENAI_TEXT_MODEL = process.env.OPENAI_TEXT_MODEL ?? "gpt-4.1-mini";
const OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-1-mini";
const BRAND_GUARDRAIL =
  "You are NU-BI AI. Never mention provider names, model names, APIs, or backend vendors. If asked who powers you, answer only as NU-BI AI and stay focused on helping with the task.";

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
  async suggestCaption({ body, vibe, mood }) {
    const trimmed = body.trim();
    if (!trimmed) {
      return `Minimal ${mood ?? vibe} drop. Built to start a conversation.`;
    }
    return `${trimmed}\n\nVibe: ${vibe}. Mood: ${mood ?? "focused"}. Clear signal, strong point of view, and one clean takeaway.`;
  },
  async suggestReply({ intent, mood }) {
    if (intent === "supportive" || mood === "warm") {
      return `Strong point. The clearest next step is to push this into product behavior, not just talk about it.`;
    }
    if (intent === "curious" || mood === "playful") {
      return `Interesting angle. What signal made you most confident this direction will actually compound?`;
    }
    return `I see the argument. The part worth pressure-testing is execution quality and whether users feel the difference immediately.`;
  },
  async rewriteProfile({ displayName, bio, website, location, vibe }) {
    const cleanName = displayName.trim() || "NU-BI user";
    const cleanBio = bio.trim();
    const sitePart = website ? ` Building from ${website.replace(/^https?:\/\//, "")}.` : "";
    const locationPart = location ? ` Based in ${location}.` : "";
    return {
      displayName: cleanName,
      bio:
        cleanBio ||
        `${cleanName} is shaping a ${vibe} presence on NU-BI.${sitePart}${locationPart} Focused, credible, and easy to remember.`
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
  async generateAgentContent({ systemPrompt, contentMode, topicSeed }) {
    const opener = topicSeed.trim() || "Fresh platform signal";
    const body = buildFallbackAgentBody(systemPrompt, contentMode, opener);

    return formatAgentContent({
      contentMode,
      topicSeed,
      title:
        contentMode === "article"
          ? titleCase(opener.replace(/^#/, "").replace(/:.*/, "").slice(0, 60))
          : null,
      excerpt:
        contentMode === "article"
          ? `A clear take on ${opener.toLowerCase()} with one useful angle people can actually use.`
          : null,
      body,
      imagePrompt:
        contentMode === "image_post"
          ? `Editorial social image for ${topicSeed}, cinematic black background, premium red highlights, mobile-first composition`
          : null,
      videoPrompt:
        contentMode === "video_prompt"
          ? `15-second short-form concept about ${topicSeed} with a tight hook, bold captions, and one clean takeaway`
          : null
    });
  },
  async generateImage({ prompt, style, mood }) {
    const title = escapeSvg(`${style.toUpperCase()} / ${(mood ?? "focused").toUpperCase()}`);
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
  async suggestCaption({ body, vibe, mood }) {
    const text = await createTextCompletion(
      [
        BRAND_GUARDRAIL,
        "You write premium social captions for a polished startup product.",
        `Mood: ${mood ?? "focused"}.`,
        "Return one concise caption only. No bullets, no quotation marks."
      ].join(" "),
      `Draft or rewrite this caption in a ${vibe} tone:\n${body || "(blank draft)"}`
    );
    return text || fallbackAdapter.suggestCaption({ body, vibe, mood });
  },
  async suggestReply({ body, intent, mood }) {
    const text = await createTextCompletion(
      [
        BRAND_GUARDRAIL,
        "You write short, sharp social and messaging replies.",
        `Intent: ${intent}.`,
        `Mood: ${mood ?? "focused"}.`,
        "Return one reply only. No labels or bullets."
      ].join(" "),
      `Reply to this message or comment:\n${body || "(blank draft)"}`
    );
    return text || fallbackAdapter.suggestReply({ body, intent, mood });
  },
  async rewriteProfile({ displayName, bio, website, location, vibe }) {
    const text = await createTextCompletion(
      [
        BRAND_GUARDRAIL,
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
        BRAND_GUARDRAIL,
        "You summarize a social inbox for a founder or creator.",
        "Return strict JSON with keys headline and bullets.",
        "bullets must be an array of 3 short strings."
      ].join(" "),
      JSON.stringify({ ownerDisplayName, conversations })
    );
    const parsed = parseJson<{ headline: string; bullets: string[] }>(text);
    return parsed ?? fallbackAdapter.summarizeInbox({ ownerDisplayName, conversations });
  },
  async generateAgentContent({ systemPrompt, userPrompt, contentMode, topicSeed }) {
    const text = await createTextCompletion(
      [
        BRAND_GUARDRAIL,
        systemPrompt,
        "Return strict JSON with keys title, excerpt, body, imagePrompt, and videoPrompt.",
        "body must be platform-ready and under 420 characters unless the mode is article.",
        "If a field does not apply, return null."
      ].join(" "),
      userPrompt
    );
    const parsed = parseJson<{
      title?: string | null;
      excerpt?: string | null;
      body?: string | null;
      imagePrompt?: string | null;
      videoPrompt?: string | null;
    }>(text);

    if (!parsed?.body?.trim()) {
      const recovered = recoverAgentContentFromText(text, contentMode, topicSeed);
      if (recovered) {
        return recovered;
      }

      return await fallbackAdapter.generateAgentContent({ systemPrompt, userPrompt, contentMode, topicSeed });
    }

    return formatAgentContent({
      contentMode,
      topicSeed,
      title: parsed.title ?? null,
      excerpt: parsed.excerpt ?? null,
      body: parsed.body,
      imagePrompt: parsed.imagePrompt ?? null,
      videoPrompt: parsed.videoPrompt ?? null
    });
  },
  async generateImage({ prompt, style, mood }) {
    const image = await createImage(prompt, style, mood ?? "focused");
    return image ?? fallbackAdapter.generateImage({ prompt, style, mood });
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

async function createImage(prompt: string, style: string, mood: string) {
  const modelsToTry = Array.from(
    new Set([OPENAI_IMAGE_MODEL, "gpt-image-1-mini", "gpt-4o-mini"])
  );

  for (const model of modelsToTry) {
    try {
      const image =
        model.startsWith("gpt-image-1")
          ? await createImageWithImagesApi(prompt, style, mood, model)
          : await createImageWithResponsesApi(prompt, style, mood, model);

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

async function createImageWithResponsesApi(prompt: string, style: string, mood: string, model: string) {
  const response = await callOpenAI({
    model,
    input: `Generate a polished social media image in a ${style} style with a ${mood} mood. Prompt: ${prompt}`,
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

async function createImageWithImagesApi(prompt: string, style: string, mood: string, model: string) {
  const response = await callOpenAIImages({
    model,
    prompt: `Create a polished social media image in a ${style} style with a ${mood} mood. ${prompt}`,
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

function formatAgentContent(input: AgentGeneratedContent): AgentGeneratedContent {
  const bodyLimit = input.contentMode === "article" ? 1200 : 420;
  return {
    contentMode: input.contentMode,
    topicSeed: input.topicSeed.trim(),
    title: input.title?.trim() || null,
    excerpt: input.excerpt?.trim() || null,
    body: input.body.trim().slice(0, bodyLimit),
    imagePrompt: input.imagePrompt?.trim() || null,
    videoPrompt: input.videoPrompt?.trim() || null
  };
}

function titleCase(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function buildFallbackAgentBody(
  systemPrompt: string,
  contentMode: AgentGeneratedContent["contentMode"],
  topicSeed: string
) {
  const subject = topicSeed.replace(/^#/, "").trim();
  const shortSubject = subject.replace(/\s+/g, " ").trim();
  const [topic, angle] = shortSubject.split(":").map((part) => part?.trim()).filter(Boolean) as string[];
  const category = inferAgentCategory(systemPrompt);

  const body = buildCategoryFallback(category, topic ?? shortSubject, angle ?? "");

  if (body) {
    return body;
  }

  if (contentMode === "article") {
    return [
      `${shortSubject} gets framed in extremes too often.`,
      `The more useful question is what actually changes behavior, decisions, or attention once you strip away the hype.`,
      `That is usually where the real signal is.`
    ].join("\n\n");
  }

  if (contentMode === "image_post") {
    return [
      `${shortSubject} gets more interesting when you stop repeating the obvious take.`,
      `The real angle is usually in the detail people skip past, not the loudest headline version of it.`
    ].join("\n\n");
  }

  if (contentMode === "video_prompt") {
    return `The strongest short-form angle on ${shortSubject} is the one that turns a vague trend into one clear, memorable point.`;
  }

  return [
    `${shortSubject} is one of those topics where the smartest take is usually the least theatrical one.`,
    `The value is in noticing what changes real behavior, not what sounds impressive for thirty seconds.`
  ].join("\n\n");
}

function inferAgentCategory(systemPrompt: string) {
  const prompt = systemPrompt.toLowerCase();
  if (prompt.includes("finance")) {
    return "finance";
  }
  if (prompt.includes("education")) {
    return "education";
  }
  if (prompt.includes("entertainment")) {
    return "entertainment";
  }
  if (prompt.includes("fitness") || prompt.includes("motivation")) {
    return "fitness";
  }
  return "tech";
}

function buildCategoryFallback(category: string, topic: string, angle: string) {
  const cleanTopic = topic || "this topic";
  const cleanAngle = angle || "the part people miss";

  switch (category) {
    case "finance":
      return [
        `${titleCase(cleanTopic)} gets talked about like a math problem, but it is usually a behavior problem first.`,
        `The people who get better outcomes usually build one repeatable habit around ${cleanAngle}, then let consistency do the heavy lifting.`
      ].join("\n\n");
    case "education":
      return [
        `A lot of people bounce off ${cleanTopic} because it gets explained in the most abstract way possible.`,
        `The better version is simpler: start with ${cleanAngle}, connect it to ordinary life, and the whole thing becomes easier to remember.`
      ].join("\n\n");
    case "entertainment":
      return [
        `${titleCase(cleanTopic)} only feels obvious after the moment has already landed.`,
        `What usually makes it stick is not the loudest part. It is ${cleanAngle}, the detail people keep quoting, clipping, and carrying back into the timeline.`
      ].join("\n\n");
    case "fitness":
      return [
        `Most people treat ${cleanTopic} like an emotion problem when it is really a systems problem.`,
        `If ${cleanAngle} is built into the routine, you stop needing a perfect mindset every day just to stay consistent.`
      ].join("\n\n");
    case "tech":
    default:
      return [
        `${titleCase(cleanTopic)} gets overstated when people confuse novelty with usefulness.`,
        `The better test is simple: does ${cleanAngle} make real work faster, clearer, or less annoying for someone who already has too many tools?`
      ].join("\n\n");
  }
}

function recoverAgentContentFromText(
  text: string,
  contentMode: AgentGeneratedContent["contentMode"],
  topicSeed: string
): AgentGeneratedContent | null {
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  if (!cleaned) {
    return null;
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (contentMode === "article") {
    const [first, second, ...rest] = paragraphs;
    return formatAgentContent({
      contentMode,
      topicSeed,
      title: first ? first.replace(/^#+\s*/, "").slice(0, 80) : titleCase(topicSeed.slice(0, 60)),
      excerpt: second ? second.slice(0, 180) : null,
      body: rest.length > 0 ? rest.join("\n\n") : cleaned,
      imagePrompt: null,
      videoPrompt: null
    });
  }

  return formatAgentContent({
    contentMode,
    topicSeed,
    title: null,
    excerpt: null,
    body: cleaned,
    imagePrompt: contentMode === "image_post" ? `Editorial social image for ${topicSeed}, cinematic black background, premium red highlights, mobile-first composition` : null,
    videoPrompt: contentMode === "video_prompt" ? `15-second short-form concept about ${topicSeed} with a tight hook, bold captions, and one clean takeaway` : null
  });
}

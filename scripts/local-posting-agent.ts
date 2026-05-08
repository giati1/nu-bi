const DEFAULT_OLLAMA_URL = "http://localhost:11434/api/generate";
const DEFAULT_MODEL = "gemma3:4b";
const DEFAULT_RUNNER_URL =
  "https://nu-bi-preview.cedricfjohnson.workers.dev/api/internal/local-agent/post";

type AgentMode = "text" | "news" | "image_prompt";

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const secret = process.env.LOCAL_AGENT_SECRET?.trim();

  if (!secret) {
    throw new Error("LOCAL_AGENT_SECRET is required.");
  }

  const body = await generateWithOllama({
    ollamaUrl: process.env.OLLAMA_URL?.trim() || DEFAULT_OLLAMA_URL,
    model: options.model,
    prompt: buildPrompt(options)
  });

  const response = await fetch(options.runnerUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-nubi-agent-secret": secret
    },
    body: JSON.stringify({
      agentSlug: options.agentSlug,
      body,
      mode: options.mode,
      topic: options.topic,
      model: options.model
    })
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? `Preview Worker request failed with status ${response.status}.`);
  }

  console.log(
    JSON.stringify(
      {
        mode: options.mode,
        model: options.model,
        agentSlug: options.agentSlug,
        topic: options.topic,
        body,
        result: payload
      },
      null,
      2
    )
  );
}

async function generateWithOllama(input: {
  ollamaUrl: string;
  model: string;
  prompt: string;
}) {
  const response = await fetch(input.ollamaUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: input.model,
      prompt: input.prompt,
      stream: false
    })
  });

  const payload = (await response.json().catch(() => null)) as
    | { response?: string; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Ollama request failed.");
  }

  const text = payload?.response?.trim() ?? "";
  if (!text) {
    throw new Error("Ollama returned an empty response.");
  }

  return sanitizePost(text);
}

function buildPrompt(options: {
  mode: AgentMode;
  topic: string;
  agentSlug: string;
}) {
  const shared = [
    "You are writing for NOMI, a stylish social app.",
    `Write as @${options.agentSlug}.`,
    "Tone: cultured, hip, natural, socially fluent, not robotic, not marketer-speak.",
    "Keep it short.",
    "No hashtags unless absolutely necessary.",
    "No quotation marks around the whole post.",
    "Return only the post body."
  ];

  if (options.mode === "news") {
    return [
      ...shared,
      "Write a short news-aware social post with a sharp take and one clean observation.",
      `Topic: ${options.topic}`
    ].join("\n");
  }

  if (options.mode === "image_prompt") {
    return [
      ...shared,
      "Write a post that reads like a caption for an image-based post, grounded and current.",
      `Topic: ${options.topic}`
    ].join("\n");
  }

  return [
    ...shared,
    "Write a short social post that feels current and genuinely human.",
    `Topic: ${options.topic}`
  ].join("\n");
}

function sanitizePost(value: string) {
  return value
    .replace(/^["'`]+|["'`]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 420);
}

function parseArgs(args: string[]) {
  const get = (flag: string) => {
    const item = args.find((entry) => entry.startsWith(`${flag}=`));
    return item ? item.slice(flag.length + 1).trim() : "";
  };

  const mode = normalizeMode(get("--mode"));
  const topic = get("--topic") || "a current culture, AI, or style observation";

  return {
    mode,
    topic,
    model: get("--model") || DEFAULT_MODEL,
    agentSlug: get("--agent") || "nomi-host",
    runnerUrl: process.env.LOCAL_AGENT_RUNNER_URL?.trim() || DEFAULT_RUNNER_URL
  };
}

function normalizeMode(value: string): AgentMode {
  if (value === "news" || value === "image_prompt") {
    return value;
  }

  return "text";
}

void main().catch((error) => {
  console.error(
    JSON.stringify(
      {
        error: error instanceof Error ? error.message : String(error)
      },
      null,
      2
    )
  );
  process.exitCode = 1;
});

export {};

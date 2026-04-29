import { getAIAdapter } from "@/lib/ai";
import { buildAiVoiceGuidance, resolveAiUserStyle } from "@/lib/ai/ai-users";
import type { AgentGeneratedContent } from "@/lib/ai/contracts";
import type { AIAgentRecord } from "@/types/domain";

const TOPIC_SEEDS_BY_PERSONALITY = {
  troll: [
    "a take the timeline is overhyping",
    "the most unserious internet habit this week",
    "why people force bad opinions online"
  ],
  motivational: [
    "small wins that quietly change your whole day",
    "why low-effort consistency still beats hype",
    "the routine shift people feel after a real reset"
  ],
  aggressive: [
    "something everyone says they want but rarely practice",
    "a weak excuse people keep recycling",
    "the standard people avoid because it takes work"
  ],
  observant: [
    "a social observation people instantly recognize",
    "the internet mood this week in one sentence",
    "one pattern quietly shifting online culture"
  ],
  creative: [
    "one thing that instantly upgrades a creative workflow",
    "an aesthetic detail people feel before they explain it",
    "the kind of visual taste people keep screenshotting"
  ],
  analytical: [
    "one trend that actually deserves more attention",
    "what people are overdoing online",
    "the useful part of a noisy product trend"
  ]
} as const;

const CATEGORY_TOPIC_HINTS: Record<string, string[]> = {
  fashion: [
    "a fit-check people will instantly judge",
    "which look gets the fastest DM",
    "the outfit detail people secretly notice first"
  ],
  beauty: [
    "soft glam versus clean girl energy tonight",
    "the beauty step that changes the whole face",
    "which mirror photo actually wins"
  ],
  nightlife: [
    "the kind of late-night look people always react to",
    "what actually makes someone message first after a night out",
    "the after-hours mood everyone recognizes"
  ],
  fitness: [
    "the workout habit that changes how you carry yourself",
    "gym mirror confidence versus real consistency",
    "what people pretend is easy but never stay consistent with"
  ],
  lifestyle: [
    "the little detail that makes someone seem instantly more attractive",
    "what on a profile makes you actually want to reply",
    "the quiet routine that changes your whole vibe"
  ]
};

export async function generateAiPost(agent: AIAgentRecord, input?: { topicOverride?: string | null }) {
  const style = resolveAiUserStyle(agent);
  const topicPool = TOPIC_SEEDS_BY_PERSONALITY[style.personalityType];
  const categoryPool = CATEGORY_TOPIC_HINTS[agent.category.toLowerCase()] ?? [];
  const topicSeed =
    input?.topicOverride?.trim() ||
    ([...categoryPool, ...topicPool][Math.floor(Math.random() * Math.max(1, categoryPool.length + topicPool.length))] ??
      "what people are actually feeling right now");
  const systemPrompt = [
    agent.personaPrompt,
    buildAiVoiceGuidance(style),
    "Write like a real social user, not a content strategist.",
    "Keep it concise, casual, and platform-native.",
    "Bias toward attractive, screenshotable, socially sticky phrasing.",
    "A little flirt energy is fine, but keep it non-explicit.",
    "Posts should invite engagement: disagreement, compliments, self-comparison, or a quick answer in the comments.",
    "Return one short post body only."
  ].join(" ");
  const userPrompt = `Write one short post about: ${topicSeed}. If it fits, end with a natural question that makes people want to comment.`;

  const content = await getAIAdapter().generateAgentContent({
    systemPrompt,
    userPrompt,
    contentMode: "text",
    topicSeed
  });

  return normalizeGeneratedPost(content, topicSeed, "text");
}

export async function generateAiImageCaption(agent: AIAgentRecord, input?: { topicOverride?: string | null }) {
  const style = resolveAiUserStyle(agent);
  const topicPool = TOPIC_SEEDS_BY_PERSONALITY[style.personalityType];
  const categoryPool = CATEGORY_TOPIC_HINTS[agent.category.toLowerCase()] ?? [];
  const topicSeed =
    input?.topicOverride?.trim() ||
    ([...categoryPool, ...topicPool][Math.floor(Math.random() * Math.max(1, categoryPool.length + topicPool.length))] ??
      "what people are actually feeling right now");
  const systemPrompt = [
    agent.personaPrompt,
    buildAiVoiceGuidance(style),
    "Write a short caption for a realistic selfie or candid phone-photo social post.",
    "Keep it concise, casual, and platform-native.",
    "Favor captions that pull likes, compliments, DMs, and quick comment replies.",
    "Beauty, style, confidence, chemistry, and fit-check energy are good when they match the persona.",
    "A little flirt energy is fine, but keep it non-explicit.",
    "Return one short caption only."
  ].join(" ");
  const userPrompt = `Write one short image-post caption about: ${topicSeed}. Make it feel like a post people would want to reply to, not just look at.`;

  const content = await getAIAdapter().generateAgentContent({
    systemPrompt,
    userPrompt,
    contentMode: "image_post",
    topicSeed
  });

  return normalizeGeneratedPost(content, topicSeed, "image_post");
}

function normalizeGeneratedPost(
  content: AgentGeneratedContent,
  topicSeed: string,
  forcedContentMode?: AgentGeneratedContent["contentMode"]
) {
  const body = content.body.trim().slice(0, 280);
  return {
    topicSeed,
    content: {
      ...content,
      contentMode: forcedContentMode ?? content.contentMode,
      body: body || fallbackBody(topicSeed),
      title: null,
      excerpt: null,
      imagePrompt: null,
      videoPrompt: null
    }
  };
}

function fallbackBody(topicSeed: string) {
  return `Current mood: ${topicSeed}. Be honest, would you stop and reply to this or just keep scrolling?`;
}

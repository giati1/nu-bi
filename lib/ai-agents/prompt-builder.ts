import type { AIAgentContentMode, AIAgentRecord } from "@/types/domain";

export function buildAgentPromptBundle(input: {
  agent: AIAgentRecord;
  contentMode: AIAgentContentMode;
  topicSeed: string;
  recentTopics: string[];
  recentBodies: string[];
}) {
  const maxCharacters = input.contentMode === "article" ? 1200 : 420;
  const systemPrompt = [
    input.agent.personaPrompt,
    `Category: ${input.agent.category}.`,
    `Content mode: ${input.contentMode}.`,
    `Maximum body length: ${maxCharacters} characters.`,
    "Write like a sharp human account with taste and a point of view, not like an AI assistant.",
    "The post must feel natively written for a social feed, not like a content brief or internal note.",
    "Lead with a concrete observation, opinion, or useful framing.",
    "Use natural rhythm and specificity. Vary sentence length. Avoid boilerplate inspiration-speak.",
    "Avoid repetition, fluff, clickbait, and hashtags unless truly helpful.",
    "Do not claim breaking news unless the prompt explicitly provides it.",
    "Make each post capable of standing alone in a social feed.",
    "Never include labels or phrases such as Topic seed, Recent topics, through a lens, What is your read, or any reference to prompts, outputs, modes, or instructions."
  ].join(" ");

  const userPrompt = [
    `Write one post about this idea: ${input.topicSeed}.`,
    input.recentTopics.length > 0 ? `Do not reuse these recent topic angles: ${input.recentTopics.slice(0, 6).join(" | ")}` : "",
    input.recentBodies.length > 0
      ? `Do not sound like these recent posts: ${input.recentBodies
          .slice(0, 3)
          .map((body) => body.slice(0, 140))
          .join(" || ")}`
      : "",
    input.contentMode === "article"
      ? "Create a short article-style post with a sharp title, a short excerpt, and a body that reads like a confident human explainer."
      : "Create a concise social post with a strong opening and one clear idea worth sharing.",
    "Sound opinionated, specific, and socially fluent.",
    "Do not mention the writing process or repeat the topic seed mechanically.",
    "End cleanly. Avoid generic engagement bait.",
    input.contentMode === "image_post"
      ? "Also provide an image prompt that matches the post and feels premium, cinematic, and visually specific."
      : "If no image is needed, return imagePrompt as null.",
    input.contentMode === "video_prompt"
      ? "Also provide a short-form video prompt."
      : "If no video prompt is needed, return videoPrompt as null."
  ]
    .filter(Boolean)
    .join("\n");

  return {
    systemPrompt,
    userPrompt,
    serialized: JSON.stringify(
      {
        systemPrompt,
        userPrompt,
        topicSeed: input.topicSeed,
        contentMode: input.contentMode
      },
      null,
      2
    )
  };
}

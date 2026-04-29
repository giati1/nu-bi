import { generateSelfie } from "@/lib/ai/ai-images";
import { generateAiImageCaption } from "@/lib/ai/ai-posts";
import { get } from "@/lib/db/client";
import { createPost } from "@/lib/db/repository";
import type { AIAgentRecord } from "@/types/domain";

const STARTER_TOPICS_BY_CATEGORY: Record<string, string[]> = {
  fashion: [
    "a fit check people will instantly judge",
    "which look gets the fastest DM",
    "the outfit detail people secretly notice first"
  ],
  beauty: [
    "soft glam versus clean girl energy tonight",
    "which mirror photo actually wins",
    "the beauty step that changes the whole face"
  ],
  nightlife: [
    "the kind of late-night look people always react to",
    "the after-hours mood everyone recognizes",
    "what actually makes someone message first after a night out"
  ],
  fitness: [
    "gym mirror confidence versus real consistency",
    "the workout habit that changes how you carry yourself",
    "what people pretend is easy but never stay consistent with"
  ],
  lifestyle: [
    "what on a profile makes you actually want to reply",
    "the little detail that makes someone seem instantly more attractive",
    "the quiet routine that changes your whole vibe"
  ],
  culture: [
    "the type of girl the timeline always ends up talking about",
    "what kind of post makes people stop scrolling fast",
    "one social pattern everybody recognizes immediately"
  ],
  tech: [
    "the app detail people notice before they admit it",
    "what makes a product feel instantly more attractive to use",
    "the behavior signal that matters more than the hype"
  ],
  creative: [
    "the aesthetic detail people feel before they explain it",
    "which visual mood actually wins right now",
    "the kind of creative taste people keep screenshotting"
  ]
};

export async function seedStarterPostsForAgents(agents: AIAgentRecord[], minimumPostsPerAgent = 3) {
  const seeded: Array<{ agentId: string; slug: string; createdPosts: number }> = [];

  for (const agent of agents) {
    const existingRow = await get<{ count: number }>(
      `SELECT COUNT(*) AS count
       FROM posts
       WHERE user_id = ?
         AND deleted_at IS NULL
         AND status = 'published'`,
      [agent.linkedUserId]
    );
    const existingCount = existingRow?.count ?? 0;
    const needed = Math.max(0, minimumPostsPerAgent - existingCount);

    if (needed === 0) {
      seeded.push({ agentId: agent.id, slug: agent.slug, createdPosts: 0 });
      continue;
    }

    const topicPool =
      STARTER_TOPICS_BY_CATEGORY[agent.category.toLowerCase()] ?? STARTER_TOPICS_BY_CATEGORY.lifestyle;
    let createdPosts = 0;

    for (let index = 0; index < needed; index += 1) {
      const topic = topicPool[index % topicPool.length] ?? "a look people would actually comment on";
      const generatedImage = await generateSelfie({
        user: agent,
        topicOverride: topic
      });
      const generatedCaption = await generateAiImageCaption(agent, {
        topicOverride: topic
      });

      await createPost({
        userId: agent.linkedUserId,
        body: generatedCaption.content.body,
        contentType: "standard",
        status: "published",
        aiAgentId: agent.id,
        aiGenerationMode: "image_post",
        aiTopicSeed: generatedCaption.topicSeed,
        media: generatedImage
          ? [
              {
                storageKey: generatedImage.storageKey,
                url: generatedImage.url,
                mimeType: generatedImage.mimeType
              }
            ]
          : []
      });

      createdPosts += 1;
    }

    seeded.push({ agentId: agent.id, slug: agent.slug, createdPosts });
  }

  return seeded;
}

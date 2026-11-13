import { generateSelfie } from "@/lib/ai/ai-images";
import { isGeneratedAiUser, resolveAiUserStyle } from "@/lib/ai/ai-users";
import type { AIAgentRecord } from "@/types/domain";

export async function maybeCreateAiDmImageReply(input: {
  agent: AIAgentRecord;
  topicSeed: string;
  baseChance: number;
}) {
  if (!isGeneratedAiUser(input.agent)) {
    return null;
  }

  const chance = adjustImageChance(resolveAiUserStyle(input.agent).socialArchetype, input.baseChance);
  if (Math.random() > chance) {
    return null;
  }

  const generated = await generateSelfie({
    user: input.agent,
    topicOverride: input.topicSeed
  });

  if (!generated) {
    return null;
  }

  return {
    storageKey: generated.storageKey,
    url: generated.url,
    mimeType: generated.mimeType
  };
}

function adjustImageChance(
  archetype: ReturnType<typeof resolveAiUserStyle>["socialArchetype"],
  baseChance: number
) {
  switch (archetype) {
    case "flirt":
      return Math.min(0.72, baseChance + 0.18);
    case "connector":
      return Math.min(0.72, baseChance + 0.08);
    case "loyalist":
      return Math.min(0.72, baseChance + 0.04);
    case "curator":
      return Math.min(0.72, baseChance + 0.06);
    case "mentor":
      return Math.max(0.04, baseChance - 0.04);
    case "instigator":
      return Math.max(0.04, baseChance - 0.02);
    default:
      return baseChance;
  }
}

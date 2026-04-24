import { getAIAdapter } from "@/lib/ai";
import type { AgentGeneratedContent } from "@/lib/ai/contracts";
import type { AIAgentRecord } from "@/types/domain";

export async function moderateAgentContent(input: {
  agent: AIAgentRecord;
  topicSeed: string;
  content: AgentGeneratedContent;
  recentTopics: string[];
  recentBodies: string[];
}) {
  const notes: string[] = [];
  const moderation = await getAIAdapter().scoreModeration({
    body: input.content.body,
    actorId: input.agent.linkedUserId
  });

  if (moderation.labels.length > 0 || moderation.score >= 0.75) {
    notes.push(`Moderation threshold triggered (${moderation.labels.join(", ") || "high-score"}).`);
  }

  if (input.content.body.trim().length < 40) {
    notes.push("Generated body was too short to feel intentional.");
  }

  if (input.recentTopics.map(normalize).includes(normalize(input.topicSeed))) {
    notes.push("Topic was recently used by this agent.");
  }

  const similarity = Math.max(
    0,
    ...input.recentBodies.map((body) => calculateSimilarity(body, input.content.body))
  );
  if (similarity >= 0.82) {
    notes.push(`Body was too similar to a recent post (${Math.round(similarity * 100)}%).`);
  }

  return {
    approved: notes.length === 0,
    notes,
    similarity
  };
}

function calculateSimilarity(left: string, right: string) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }
  const overlap = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
  const denominator = new Set([...leftTokens, ...rightTokens]).size;
  return denominator > 0 ? overlap / denominator : 0;
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s#]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2);
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

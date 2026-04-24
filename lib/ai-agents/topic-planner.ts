import type { AIAgentRecord } from "@/types/domain";

const fallbackTopicSeeds: Record<string, string[]> = {
  finance: [
    "small daily spending leaks that wreck monthly budgets",
    "how to build a simple emergency fund without feeling stuck",
    "money habits people learn too late",
    "the difference between saving discipline and income anxiety"
  ],
  education: [
    "a science fact that changes how people see the everyday world",
    "a short history lesson that feels strangely current",
    "one learning technique that actually helps retention",
    "a misconception people repeat because it sounds right"
  ],
  entertainment: [
    "the kind of scene that instantly makes people quote a movie",
    "what makes a pop culture moment feel shared online",
    "why some songs become social media mood markers",
    "the difference between hype and real fandom energy"
  ],
  fitness: [
    "why consistency beats intensity for most routines",
    "habits that make training sustainable instead of dramatic",
    "what discipline feels like on low-motivation days",
    "small wellness shifts that compound over time"
  ],
  tech: [
    "an AI workflow that saves real time instead of sounding impressive",
    "the product habit that separates useful apps from noisy ones",
    "why some software feels fast before you measure it",
    "a tech trend worth watching without overhyping it"
  ]
};

const categoryAngles: Record<string, string[]> = {
  finance: ["what people misunderstand about it", "one habit worth stealing", "the practical tradeoff nobody says out loud"],
  education: ["the part most people miss", "why it matters in ordinary life", "the easiest way to explain it clearly"],
  entertainment: ["why it hits culture so fast", "the detail fans actually lock onto", "why it works beyond hype"],
  fitness: ["what actually makes it sustainable", "the mistake beginners repeat", "what matters more than motivation"],
  tech: ["what is useful versus performative", "where the real value shows up", "what gets overstated"]
};

const blockedTrendingTags = new Set(["newswire", "startups", "viral", "trending", "fyp", "explore"]);

export function planAgentTopic(input: {
  agent: AIAgentRecord;
  trendingTags: Array<{ tag: string; count: number }>;
  recentTopics: string[];
}) {
  const categorySeeds = fallbackTopicSeeds[input.agent.category] ?? fallbackTopicSeeds.tech;
  const recent = new Set(input.recentTopics.map(normalize));

  const trendingCandidate = input.trendingTags
    .filter((item) => !blockedTrendingTags.has(item.tag.trim().toLowerCase()))
    .map((item) => buildTrendingTopic(item.tag, input.agent.category))
    .find((candidate) => !recent.has(normalize(candidate)));

  if (trendingCandidate) {
    return {
      topicSeed: trendingCandidate,
      source: "trending-tag"
    };
  }

  const fallback = categorySeeds.find((seed) => !recent.has(normalize(seed))) ?? categorySeeds[0];
  return {
    topicSeed: fallback,
    source: "category-bank"
  };
}

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function buildTrendingTopic(tag: string, category: string) {
  const cleanTag = tag.replace(/^#/, "").trim();
  const angles = categoryAngles[category] ?? categoryAngles.tech;
  const angle = angles[cleanTag.length % angles.length];
  return `${cleanTag}: ${angle}`;
}

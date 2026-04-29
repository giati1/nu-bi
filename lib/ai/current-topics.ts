type CurrentTopic = {
  headline: string;
  source: string;
  url: string | null;
};

const FALLBACK_TOPICS: CurrentTopic[] = [
  {
    headline: "whether AI tools are replacing weak work or changing the shape of jobs entirely",
    source: "fallback",
    url: null
  },
  {
    headline: "how fast people should trust AI assistants in real products",
    source: "fallback",
    url: null
  },
  {
    headline: "whether the world is actually ready for AI-native communication",
    source: "fallback",
    url: null
  }
];

export async function getCurrentAiTopic() {
  const live = await fetchLatestAiTopics();
  if (live.length > 0) {
    return live[Math.floor(Math.random() * live.length)] ?? live[0]!;
  }

  return FALLBACK_TOPICS[Math.floor(Math.random() * FALLBACK_TOPICS.length)] ?? FALLBACK_TOPICS[0]!;
}

async function fetchLatestAiTopics() {
  const urls = [
    "https://hn.algolia.com/api/v1/search_by_date?query=AI&tags=story&hitsPerPage=6",
    "https://hn.algolia.com/api/v1/search_by_date?query=OpenAI&tags=story&hitsPerPage=4"
  ];

  const topics: CurrentTopic[] = [];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        cache: "no-store"
      });
      if (!response.ok) {
        continue;
      }

      const payload = (await response.json()) as {
        hits?: Array<{
          title?: string | null;
          story_title?: string | null;
          url?: string | null;
          story_url?: string | null;
        }>;
      };

      for (const hit of payload.hits ?? []) {
        const headline = sanitizeHeadline(hit.title ?? hit.story_title ?? "");
        if (!headline) {
          continue;
        }

        topics.push({
          headline,
          source: "hn",
          url: hit.url ?? hit.story_url ?? null
        });
      }
    } catch {}
  }

  return dedupeTopics(topics).slice(0, 6);
}

function sanitizeHeadline(value: string) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned || cleaned.length < 14) {
    return null;
  }

  return cleaned.slice(0, 180);
}

function dedupeTopics(topics: CurrentTopic[]) {
  const seen = new Set<string>();
  return topics.filter((topic) => {
    const key = topic.headline.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

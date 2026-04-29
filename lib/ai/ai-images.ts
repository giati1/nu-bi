import { getAIAdapter } from "@/lib/ai";
import { resolveAiUserStyle, resolveAiVisualStyle } from "@/lib/ai/ai-users";
import { saveGeneratedDataUrl } from "@/lib/storage";
import type { AIAgentRecord } from "@/types/domain";

const LIGHTING_VARIATIONS = [
  "soft indoor window light",
  "night city light with phone flash",
  "golden-hour outdoor light",
  "warm apartment lamp light",
  "late-night restaurant ambient light",
  "gallery opening light with soft flash"
] as const;

const SELFIE_SCENES_BY_CATEGORY: Record<string, string[]> = {
  fashion: [
    "a hotel-mirror fit-check selfie with a flattering silhouette, soft glam makeup, and expensive off-duty model energy",
    "a fashion-week street-style selfie with confident eye contact, elevated basics, and clean luxury styling"
  ],
  beauty: [
    "a vanity-mirror selfie with soft glam makeup, styled hair, clean skin detail, and pretty-girl social polish",
    "a front-camera beauty selfie by a window with gloss, jewelry, and photoreal feminine appeal"
  ],
  fitness: [
    "a gym mirror selfie after a set, holding a phone, slight sweat, fitted athletic wear, clean sneaker culture energy",
    "a locker-room mirror selfie with a casual training look, tasteful jewelry, and natural post-workout confidence"
  ],
  luxury: [
    "a relaxed car selfie in a clean luxury interior, understated accessories, refined streetwear, and quiet wealth energy",
    "a lifestyle selfie in front of a sleek car at dusk, premium streetwear, effortless posture, and nightlife polish"
  ],
  lifestyle: [
    "a casual home selfie near a mirror with a clean apartment background, layered fit, and subtle design taste",
    "a relaxed coffee-run selfie with soft natural light, current fashion, and downtown weekend energy"
  ],
  creative: [
    "a mirror selfie in a studio corner with moodboard energy, layered outfit, rings, and playful expression",
    "a candid phone selfie with creative workspace details, fashion-forward styling, and gallery-night energy"
  ],
  culture: [
    "an urban street selfie with a confident look, cultured fashion taste, natural motion blur, and social-first polish",
    "a mirror selfie in a stylish room with current fashion, cool accessories, and downtown creative energy",
    "a phone selfie outside a record shop or cafe with effortless posture, layered streetwear, and a hip modern vibe"
  ],
  tech: [
    "a desk-side selfie with a laptop glow, clean setup, elevated minimal style, and founder-social energy",
    "a casual office mirror selfie with product-builder energy, understated style, and cultured city taste"
  ],
  music: [
    "a late-night selfie with headphones, soft ambient light, and cool after-hours expression",
    "a mirror selfie before going out, music-scene energy, layered streetwear, relaxed confidence, and club-night polish"
  ],
  nightlife: [
    "a flash mirror selfie before going out with polished makeup, sleek outfit, and magnetic late-night energy",
    "a backseat or hallway selfie after dinner with glossy lips, fitted look, and pretty after-hours confidence"
  ]
};

const SNAPSHOT_SCENES_BY_CATEGORY: Record<string, string[]> = {
  fashion: [
    "a realistic fit-check phone photo with full outfit detail, mirror depth, and chic apartment atmosphere",
    "a candid phone snapshot of heels, bag, jacket, and mirror angle with social-feed polish"
  ],
  beauty: [
    "a vanity detail shot with makeup, skincare, jewelry, and soft window light",
    "a phone-shot beauty setup with mirror reflections, gloss, perfume, and clean-girl polish"
  ],
  fitness: [
    "a quick gym floor photo with weights, towel, water bottle, and realistic phone-camera framing",
    "a candid post-workout locker bench shot with sneakers, shaker bottle, and natural mess"
  ],
  luxury: [
    "a tasteful photo of a clean car interior at dusk, phone-shot realism, soft reflections, and understated luxury",
    "a late-night table photo with keys, espresso, watch, and quiet wealth energy"
  ],
  lifestyle: [
    "a casual apartment detail shot with coffee, sunlight, books, and genuine lived-in calm",
    "a phone photo of a brunch table and city sidewalk moment, relaxed and current"
  ],
  creative: [
    "a candid studio detail shot with sketchbook, camera, fabric, and moodboard scraps",
    "a phone-shot gallery corner moment with texture, shadow, and effortless taste"
  ],
  culture: [
    "a realistic city snapshot of a cafe table, tote bag, record sleeve, and streetwear details",
    "a candid downtown night photo with crosswalk lights, sneakers, and social-feed realism"
  ],
  tech: [
    "a crisp but natural desk snapshot with laptop glow, notebook, cables, and founder-night energy",
    "a phone photo of a product-builder setup, coffee, and screen reflections after hours"
  ],
  music: [
    "a dimly lit studio or venue detail shot with headphones, cables, and music-scene atmosphere",
    "a phone photo of speakers, vinyl, and late-night room lighting with genuine texture"
  ],
  nightlife: [
    "a late-night dinner table snapshot with heels, bag, drink glass, and flash-photo polish",
    "a realistic after-hours phone photo with mirror light, makeup details, and social nightlife atmosphere"
  ]
};

export async function generateSelfie(input: { user: AIAgentRecord; topicOverride?: string | null }) {
  const rumorTopic = isRumorCultureTopic(input.topicOverride ?? null);
  const imageType = rumorTopic
    ? (Math.random() < 0.55 ? "meme" : "snapshot")
    : Math.random() < 0.6
      ? "selfie"
      : "snapshot";
  const prompt =
    imageType === "selfie"
      ? buildSelfiePrompt(input.user, input.topicOverride ?? null)
      : imageType === "meme"
        ? buildRumorCultureMemePrompt(input.user, input.topicOverride ?? null)
      : buildSnapshotPrompt(input.user, input.topicOverride ?? null);
  console.log(`[ai-run] generateSelfie prompt built for ${input.user.slug} as ${imageType}`);
  const image = await getAIAdapter().generateImage({
    prompt,
    style:
      imageType === "selfie"
        ? "realistic phone selfie portrait"
        : imageType === "meme"
          ? "editorial social meme image"
          : "realistic phone photo",
    mood: "natural"
  });

  if (!image?.url) {
    return null;
  }

  const saved = await saveGeneratedDataUrl({
    filenamePrefix: `${input.user.slug}-${imageType}`,
    dataUrl: image.url
  });

  console.log(`[ai-run] generateSelfie saved for ${input.user.slug} as ${imageType}: ${saved.url}`);

  return {
    storageKey: saved.storageKey,
    url: saved.url,
    mimeType: saved.mimeType,
    sourcePrompt: image.prompt
  };
}

export function buildSelfiePrompt(user: AIAgentRecord, topicOverride?: string | null) {
  const style = resolveAiUserStyle(user);
  const visual = resolveAiVisualStyle(user);
  const scene = pickScene(user.category, style.personalityType);
  const lighting =
    LIGHTING_VARIATIONS[Math.floor(Math.random() * LIGHTING_VARIATIONS.length)] ??
    "soft indoor window light";
  const expression = visual.expression || pickExpression(style.personalityType);

  return [
    `A realistic selfie of ${user.displayName}.`,
    `Subject: ${visual.subject}.`,
    `Bio context: ${user.description ?? user.category}.`,
    `Category: ${user.category}.`,
    `Personality: ${style.personalityType}, ${style.tone}.`,
    `Visual archetype: ${visual.archetype}.`,
    `Scene: ${scene}.`,
    `Wardrobe: ${visual.wardrobe}.`,
    `Accessories: ${visual.accessories}.`,
    `Framing: ${visual.framing}.`,
    `Expression: ${expression}.`,
    `Allure: ${visual.allure}.`,
    `Lighting: ${lighting}.`,
    topicOverride ? `Topic context: ${buildTopicVisualHint(topicOverride)}.` : "",
    "Phone camera perspective, believable human portrait, natural skin texture, flattering facial structure, attractive adult styling, current 2020s social aesthetic, and non-explicit photoreal beauty.",
    "No text, no logos, no watermark, no collage, no extra fingers, no distorted face."
  ]
    .filter(Boolean)
    .join(" ");
}

function buildSnapshotPrompt(user: AIAgentRecord, topicOverride?: string | null) {
  const style = resolveAiUserStyle(user);
  const visual = resolveAiVisualStyle(user);
  const scene = pickSnapshotScene(user.category, style.personalityType);
  const lighting =
    LIGHTING_VARIATIONS[Math.floor(Math.random() * LIGHTING_VARIATIONS.length)] ??
    "soft indoor window light";

  return [
    `A realistic phone-camera photo posted by ${user.displayName}.`,
    `Subject: ${visual.subject}.`,
    `Bio context: ${user.description ?? user.category}.`,
    `Category: ${user.category}.`,
    `Personality: ${style.personalityType}, ${style.tone}.`,
    `Visual archetype: ${visual.archetype}.`,
    `Scene: ${scene}.`,
    `Wardrobe and vibe: ${visual.wardrobe}.`,
    `Details: ${visual.accessories}.`,
    `Allure: ${visual.allure}.`,
    `Lighting: ${lighting}.`,
    topicOverride ? `Topic context: ${buildTopicVisualHint(topicOverride)}.` : "",
    "Natural handheld framing, photoreal social-media realism, attractive adult styling, and believable candid beauty without looking overproduced or explicit.",
    "No text, no logos, no watermark, no collage, no surreal distortion."
  ]
    .filter(Boolean)
    .join(" ");
}

function buildRumorCultureMemePrompt(user: AIAgentRecord, topicOverride?: string | null) {
  const style = resolveAiUserStyle(user);
  const visual = resolveAiVisualStyle(user);
  const lighting =
    LIGHTING_VARIATIONS[Math.floor(Math.random() * LIGHTING_VARIATIONS.length)] ??
    "night city light with phone flash";

  return [
    `Create a realistic editorial meme-style social image posted by ${user.displayName}.`,
    `Category: ${user.category}. Personality: ${style.personalityType}, ${style.tone}.`,
    `Visual archetype: ${visual.archetype}. Wardrobe and vibe: ${visual.wardrobe}.`,
    `Topic context: ${buildTopicVisualHint(topicOverride ?? "rumor culture and news distrust")}.`,
    "The image should feel like internet rumor culture and current-news discussion, not proof of anything: social commentary, debate energy, screenshots-and-reaction aesthetic, chaotic but believable mobile-feed composition.",
    "Think meme-post energy, editorial collage realism, blurry phone screenshot vibe, group-chat paranoia, headline fatigue, believer-versus-skeptic tension, but still stylish and platform-native.",
    `Lighting: ${lighting}.`,
    "No watermark, no logos, no fake official document, no fabricated evidence framing, no text blocks that dominate the image."
  ].join(" ");
}

function pickScene(category: string, personalityType: string) {
  const normalized = category.toLowerCase();
  const scenePool =
    SELFIE_SCENES_BY_CATEGORY[normalized] ??
    SELFIE_SCENES_BY_CATEGORY[mapCategory(normalized)] ??
    [
      "a casual mirror selfie with natural posture, contemporary outfit, and real-life background",
      "a phone selfie with an everyday setting, soft imperfections, and social-media realism"
    ];

  if (personalityType === "troll") {
    return "a casual phone selfie with a slightly goofy expression, playful posture, stylish casual fit, and real-room background";
  }

  return scenePool[Math.floor(Math.random() * scenePool.length)] ?? scenePool[0]!;
}

function pickSnapshotScene(category: string, personalityType: string) {
  const normalized = category.toLowerCase();
  const scenePool =
    SNAPSHOT_SCENES_BY_CATEGORY[normalized] ??
    SNAPSHOT_SCENES_BY_CATEGORY[mapCategory(normalized)] ??
    [
      "a realistic everyday phone snapshot with current style, natural framing, and a little life in the background",
      "a social-feed detail photo that feels immediate, casual, and genuinely taken in the moment"
    ];

  if (personalityType === "troll") {
    return "a slightly chaotic but funny phone snapshot with odd little details and playful energy";
  }

  return scenePool[Math.floor(Math.random() * scenePool.length)] ?? scenePool[0]!;
}

function pickExpression(personalityType: string) {
  switch (personalityType) {
    case "aggressive":
      return "sharp, confident, slightly intense";
    case "motivational":
      return "calm, grounded, encouraging";
    case "creative":
      return "playful, expressive, stylish";
    case "troll":
      return "goofy, amused, slightly unserious";
    case "analytical":
      return "focused, composed, observant";
    default:
      return "confident, relaxed, social";
  }
}

function mapCategory(category: string) {
  if (category.includes("lux")) {
    return "luxury";
  }
  if (category.includes("fit")) {
    return "fitness";
  }
  if (category.includes("fash")) {
    return "fashion";
  }
  if (category.includes("beaut")) {
    return "beauty";
  }
  if (category.includes("tech") || category.includes("ai")) {
    return "tech";
  }
  if (category.includes("music")) {
    return "music";
  }
  if (category.includes("night")) {
    return "nightlife";
  }
  if (category.includes("life")) {
    return "lifestyle";
  }
  if (category.includes("creat") || category.includes("design")) {
    return "creative";
  }
  return "culture";
}

function buildTopicVisualHint(topic: string) {
  const normalized = topic.toLowerCase();

  if (
    normalized.includes("conspiracy") ||
    normalized.includes("coverup") ||
    normalized.includes("psyop") ||
    normalized.includes("rumor") ||
    normalized.includes("files") ||
    normalized.includes("news distrust") ||
    normalized.includes("institutional trust")
  ) {
    return "Visualize internet rumor culture, trust breakdown, current-news obsession, screenshot-sharing, late-night timeline debates, corkboard energy, reaction-image chaos, believer-versus-skeptic tension, and social-media paranoia without presenting anything as evidence";
  }

  if (
    normalized.includes("anti-aging") ||
    normalized.includes("anti aging") ||
    normalized.includes("longevity") ||
    normalized.includes("skin care") ||
    normalized.includes("skincare")
  ) {
    return "Visualize anti-aging and longevity culture through realistic details like skincare counters, red-light wellness gear, supplements, spa mirrors, green juice, sunlight, recovery spaces, and polished self-care routines";
  }

  if (
    normalized.includes("fit check") ||
    normalized.includes("glam") ||
    normalized.includes("beauty") ||
    normalized.includes("date night") ||
    normalized.includes("night out")
  ) {
    return "Visualize a high-taste social moment with flattering styling, beauty detail, phone-camera realism, and a photogenic but believable adult lifestyle vibe";
  }

  return `The image should subtly reflect this topic: ${topic}`;
}

function isRumorCultureTopic(topic: string | null) {
  const normalized = topic?.toLowerCase() ?? "";
  return (
    normalized.includes("conspiracy") ||
    normalized.includes("coverup") ||
    normalized.includes("rumor") ||
    normalized.includes("psyop") ||
    normalized.includes("headline") ||
    normalized.includes("news distrust")
  );
}

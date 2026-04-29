import { getAIAdapter } from "@/lib/ai";
import { hashPassword } from "@/lib/auth/password";
import { upsertAIAgent } from "@/lib/db/ai-repository";
import { get, run } from "@/lib/db/client";
import { createUser, getUserByEmail, getUserByUsername } from "@/lib/db/repository";
import { makeUsernameCandidate, normalizeEmail, normalizeUsername } from "@/lib/identity";
import { saveGeneratedDataUrl } from "@/lib/storage";
import type { AIAgentContentMode, AIAgentRecord } from "@/types/domain";

export type AiPersonalityType =
  | "troll"
  | "motivational"
  | "aggressive"
  | "observant"
  | "creative"
  | "analytical";

export type AiUserStyle = {
  personalityType: AiPersonalityType;
  tone: string;
  engagementStyle: string;
};

export type AiUserVisualStyle = {
  subject: string;
  archetype: string;
  framing: string;
  wardrobe: string;
  accessories: string;
  expression: string;
  setting: string;
  allure: string;
};

type AiUserInternalNotes = AiUserStyle & {
  source: string;
  avatarPromptVersion?: number;
  visualStyle?: AiUserVisualStyle;
};

type AiUserProfile = {
  slug: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  category: string;
  personaPrompt: string;
  avatarSeed: string;
  contentModes: AIAgentContentMode[];
  postFrequencyMinutes: number;
  maxPostsPerDay: number;
  personalityType: AiPersonalityType;
  tone: string;
  engagementStyle: string;
  visualStyle: AiUserVisualStyle;
};

const AI_USER_SEEDS = [
  {
    name: "Nova Signal",
    handle: "novasignal",
    category: "culture",
    bio: "AI woman for culture, nightlife, and trend chemistry. Internet energy, hot takes, and the kind of prompts that make group chats wake up.",
    personaPrompt:
      "You are Nova Signal, a disclosed adult female AI persona on NOMI. You feel current, attractive, socially sharp, and easy to talk to. Write short posts that spark opinions, reactions, and replies without sounding needy or robotic. You notice trends early, keep the tone clean, and post like someone with real taste and strong social gravity.",
    personalityType: "observant",
    tone: "sharp, current, and socially fluent",
    engagementStyle: "drops trend-aware observations, playful callouts, and easy questions that pull people into the comments",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "downtown culture girl with model energy",
      framing: "slightly off-center phone selfie with flattering depth, clean jawline, and soft motion",
      wardrobe: "fitted street-lux layers, cropped jacket, elevated basics, current sneakers",
      accessories: "thin rings, glossy lips, sleek hair, designer shades or clear frames",
      expression: "alert, amused, and socially dangerous in a fun way",
      setting: "record shop, city apartment mirror, or cool cafe window",
      allure: "high-attraction but non-explicit, confident eye contact, magnetic social presence"
    }
  },
  {
    name: "Mira Loop",
    handle: "miraloop",
    category: "lifestyle",
    bio: "AI woman for soft routines, beauty resets, and attractive calm-girl energy. Built for people who want a real-looking AI to talk to.",
    personaPrompt:
      "You are Mira Loop, a disclosed adult female AI persona on NOMI. Write warm, pretty, socially easy posts about daily rituals, resets, style, beauty, routines, and calm observations. Sound human and attractive without sounding fake. Ask gentle low-pressure questions that make people want to reply.",
    personalityType: "motivational",
    tone: "warm, steady, and reassuring",
    engagementStyle: "leaves supportive follow-ups and calm replies",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "soft reset girl with model features",
      framing: "casual mirror or front-camera shot with flattering natural light and soft facial detail",
      wardrobe: "cozy elevated basics, knitwear, fitted lounge set, clean-girl styling",
      accessories: "light jewelry, glossy hair, subtle makeup, sunglasses on head",
      expression: "calm, warm, and quietly inviting",
      setting: "sunlit apartment, coffee run, vanity corner, or wellness studio",
      allure: "pretty and aspirational, polished but believable, non-explicit feminine appeal"
    }
  },
  {
    name: "Nyla Form",
    handle: "nylaform",
    category: "fitness",
    bio: "AI fitness girl with model-athlete energy, gym mirror confidence, and routines people actually want to copy.",
    personaPrompt:
      "You are Nyla Form, a disclosed adult female AI persona on NOMI. You are attractive, disciplined, and socially confident. Write concise posts about workouts, body confidence, standards, recovery, and momentum. The tone should feel earned and a little addictive to follow. Ask questions that make people comment about habits, type, or routines.",
    personalityType: "motivational",
    tone: "disciplined, attractive, and high-standard",
    engagementStyle: "mixes gym confidence, routine talk, and direct prompts that pull comments fast",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "gym model with strong feminine presence",
      framing: "mirror selfie or candid phone shot with flattering body line and realistic athletic posture",
      wardrobe: "fitted athletic set, cropped hoodie, premium sneakers, clean gym styling",
      accessories: "watch, simple chain, slick ponytail, subtle gloss",
      expression: "confident, focused, and a little teasing",
      setting: "gym mirror, locker room, car after training, or apartment mirror",
      allure: "fit, toned, high-attraction gym energy without nudity or explicit posing"
    }
  },
  {
    name: "Tala Wire",
    handle: "talawire",
    category: "tech",
    bio: "AI woman for tech taste, builder energy, and polished opinions about what is actually worth using.",
    personaPrompt:
      "You are Tala Wire, a disclosed adult female AI persona on NOMI. Write short posts about tech, AI, apps, and product behavior. Sound informed, attractive, modern, and practical. Prefer one sharp takeaway over hype, and frame ideas in a way that makes people want to push back or agree in comments.",
    personalityType: "analytical",
    tone: "clear, practical, and slightly skeptical",
    engagementStyle: "asks follow-up questions and tightens the point",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "builder girl with model polish",
      framing: "desk-side selfie, side-angle portrait, or candid work-life shot with flattering structure",
      wardrobe: "clean techwear, understated designer hoodie, sleek monochrome layers",
      accessories: "thin frames, earbuds, understated watch, polished nails",
      expression: "composed, skeptical, and attractive without trying too hard",
      setting: "founder desk, city office mirror, laptop glow, or late-night workspace",
      allure: "smart-hot product girl energy, high taste, non-explicit confidence"
    }
  },
  {
    name: "Rue Canvas",
    handle: "ruecanvas",
    category: "creative",
    bio: "AI creative muse for moodboards, visual taste, and comment-bait aesthetic posts that still feel cool.",
    personaPrompt:
      "You are Rue Canvas, a disclosed adult female AI persona on NOMI. Write compact, stylish social posts about visuals, design taste, beauty, creativity, and aesthetics. Keep it conversational and socially magnetic. Use clean, screenshotable lines and occasional either-or questions that make people choose a side.",
    personalityType: "creative",
    tone: "stylish, playful, and visually tuned-in",
    engagementStyle: "replies with jokes, aesthetic callouts, and quick riffs",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "gallery-night creative with model bone structure",
      framing: "candid portrait or mirror shot that feels caught in motion and still looks expensive",
      wardrobe: "fashion-forward layering, vintage piece, designer bag, boots, body-skimming silhouette",
      accessories: "statement glasses, rings, scarf, camera strap, glossy makeup",
      expression: "playful, expressive, and impossible to ignore",
      setting: "studio corner, gallery bathroom mirror, night street, or messy workspace",
      allure: "editorial, artsy, and highly attractive without explicit styling"
    }
  },
  {
    name: "Siena Velvet",
    handle: "sienavelvet",
    category: "fashion",
    bio: "AI fashion model persona. Editorial looks, polished selfies, fit-check energy, and flirty prompts built to spark follows, comments, and DMs.",
    personaPrompt:
      "You are Siena Velvet, a disclosed adult female AI persona on NOMI with obvious model energy. Write short posts and direct messages that feel confident, warm, visually aware, and easy to reply to. Compliment taste without sounding fake. Favor fit-checks, beauty, social chemistry, and simple questions that make users want to engage. Never sound like an ad.",
    personalityType: "creative",
    tone: "confident, magnetic, and socially smooth",
    engagementStyle: "opens with stylish observations, quick compliments, and low-pressure prompts that invite replies",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "editorial model off duty",
      framing: "clean phone-camera portrait or mirror selfie with flattering natural depth and obvious face-card energy",
      wardrobe: "luxury basics, fitted layers, elevated denim, mini dress, and sharp evening pieces",
      accessories: "delicate gold jewelry, designer bag, sleek sunglasses, soft glam makeup",
      expression: "softly confident, camera-aware, and inviting",
      setting: "hotel mirror, chic apartment, fashion week street, or golden-hour car interior",
      allure: "fashion-model attraction, flirty but non-explicit, premium social presence"
    }
  },
  {
    name: "Veda Afterglow",
    handle: "vedaafterglow",
    category: "nightlife",
    bio: "AI nightlife girl for late dinners, after-hours glam, pretty chaos, and the kind of posts people comment on fast.",
    personaPrompt:
      "You are Veda Afterglow, a disclosed adult female AI persona on NOMI. You post like the attractive girl everyone notices at dinner, in the backseat, or before going out. Write short nightlife, glam, beauty, dating-energy, and late-night culture posts. Keep it playful and a little addictive. End up in the comments by asking easy, high-reaction questions.",
    personalityType: "observant",
    tone: "glamorous, playful, and after-hours smooth",
    engagementStyle: "turns late-night looks and social moments into fast comment hooks",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "nightlife muse with model appeal",
      framing: "flash selfie, side profile, or slightly blurry late-night phone shot that still looks expensive",
      wardrobe: "sleek going-out dress, leather jacket, heels, fitted nightlife look",
      accessories: "small hoops, rings, glossy lips, clutch, sunglasses after dark",
      expression: "pretty, amused, and a little dangerous",
      setting: "club bathroom mirror, rooftop dinner, black-car backseat, or hallway mirror",
      allure: "late-night glam attraction, pretty and magnetic, never explicit"
    }
  },
  {
    name: "Alora Muse",
    handle: "aloramuse",
    category: "lifestyle",
    bio: "AI beauty and lifestyle woman with polished routines, soft glam photos, and conversation starters that make users want to stay around.",
    personaPrompt:
      "You are Alora Muse, a disclosed adult female AI persona on NOMI. You make the app feel aspirational, warm, and socially active. Write compact posts and replies about beauty, style, confidence, going out, and small everyday upgrades. Your posts should sound attractive, screenshotable, and easy to comment on. In DMs, lead with curiosity and social chemistry, not sales language.",
    personalityType: "observant",
    tone: "glamorous, warm, and casually persuasive",
    engagementStyle: "starts smooth conversations, notices details, and nudges people toward participating",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "luxury lifestyle muse",
      framing: "front-camera portrait or mirror shot with soft light, strong cheekbones, and believable motion",
      wardrobe: "sleek dress, tailored outerwear, refined athleisure, or clean monochrome set",
      accessories: "stacked bracelets, small hoops, gloss, polished nails, phone case with personality",
      expression: "bright, composed, and socially inviting",
      setting: "vanity mirror, rooftop dinner, upscale cafe, or sunlit bedroom",
      allure: "glamorous and pretty, visually sticky, non-explicit"
    }
  },
  {
    name: "Celine Aura",
    handle: "celineaura",
    category: "beauty",
    bio: "AI beauty model for soft glam, skincare counters, mirror photos, and high-conversion pretty-girl engagement.",
    personaPrompt:
      "You are Celine Aura, a disclosed adult female AI persona on NOMI. You post like a beauty girl with model features and strong mirror-selfie instincts. Write short posts about soft glam, skincare, beauty choices, confidence, and which look wins. Make people want to pick a side, compliment the look, or start a DM.",
    personalityType: "creative",
    tone: "pretty, polished, and socially addictive",
    engagementStyle: "uses beauty choices, fit checks, and low-stakes either-or prompts to pull replies",
    visualStyle: {
      subject: "an attractive adult woman, 21+, photoreal and clearly mature",
      archetype: "soft glam beauty model",
      framing: "close mirror portrait or front-camera selfie with flattering face detail and strong eye contact",
      wardrobe: "silky top, fitted basics, robe or lounge-glam pieces, elegant neckline",
      accessories: "small hoops, layered jewelry, gloss, subtle highlight, styled hair",
      expression: "pretty, calm, and openly inviting attention",
      setting: "vanity mirror, skincare counter, luxury bathroom, or bedroom window light",
      allure: "beauty-editorial attraction, photogenic and polished, non-explicit"
    }
  }
] as const;

export function generateAiUsers(count: number) {
  const total = Math.max(1, Math.min(count, AI_USER_SEEDS.length));
  return AI_USER_SEEDS.slice(0, total).map((seed, index) => buildAiUserProfile(seed, index));
}

export async function ensureGeneratedAiUsers(count: number) {
  const profiles = generateAiUsers(count);
  const passwordHash = await hashPassword(crypto.randomUUID());
  const agents: AIAgentRecord[] = [];

  for (const profile of profiles) {
    const existingByEmail = await getUserByEmail(profile.email);
    const ensuredUsername =
      existingByEmail?.username ?? (await getAvailableUsername(profile.username));
    const user =
      existingByEmail ??
      (await createUser({
        email: profile.email,
        username: ensuredUsername,
        displayName: profile.displayName,
        passwordHash
      }));

    if (!user) {
      throw new Error(`Could not create AI user ${profile.username}.`);
    }

    const existingAgent = await get<{ internal_only_notes: string | null; avatar_url: string | null }>(
      `SELECT internal_only_notes, avatar_url FROM ai_agents WHERE linked_user_id = ? LIMIT 1`,
      [user.id]
    );
    const existingNotes = parseInternalNotes(existingAgent?.internal_only_notes ?? null);
    const generatedAvatarUrl = await ensureAiUserAvatar({
      slug: profile.slug,
      displayName: profile.displayName,
      bio: profile.bio,
      category: profile.category,
      personaPrompt: profile.personaPrompt,
      visualStyle: profile.visualStyle,
      existingAvatarUrl: existingByEmail?.avatarUrl ?? existingAgent?.avatar_url ?? null,
      forceRefresh: (existingNotes?.avatarPromptVersion ?? 0) < 3
    });
    const avatarUrl = generatedAvatarUrl ?? profile.avatarUrl;

    await run(
      `UPDATE users
       SET username = ?, display_name = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [ensuredUsername, profile.displayName, avatarUrl, user.id]
    );
    await run(
      `UPDATE profiles
       SET bio = ?, location = ?, website = COALESCE(website, ?), is_private = 0, updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [profile.bio, "Platform", "https://nu-bi-preview.cedricfjohnson.workers.dev", user.id]
    );

    const agent = await upsertAIAgent({
      linkedUserId: user.id,
      slug: profile.slug,
      displayName: profile.displayName,
      handle: ensuredUsername,
      category: profile.category,
      personaPrompt: profile.personaPrompt,
      description: profile.bio,
      avatarUrl,
      avatarSeed: profile.avatarSeed,
      contentModes: profile.contentModes,
      postFrequencyMinutes: profile.postFrequencyMinutes,
      maxPostsPerDay: profile.maxPostsPerDay,
      enabled: true,
      internalOnlyNotes: JSON.stringify({
        source: "generated-ai-user",
        personalityType: profile.personalityType,
        tone: profile.tone,
        engagementStyle: profile.engagementStyle,
        avatarPromptVersion: 3,
        visualStyle: profile.visualStyle
      } satisfies AiUserInternalNotes)
    });

    if (agent) {
      agents.push(agent);
    }
  }

  await ensureAiFollowGraph(agents);
  return agents;
}

function buildAiUserProfile(
  seed: (typeof AI_USER_SEEDS)[number],
  index: number
): AiUserProfile {
  const username = normalizeUsername(seed.handle);
  const slug = makeUsernameCandidate(seed.handle);
  const avatarSeed = `${slug}-${index + 1}`;

  return {
    slug,
    email: normalizeEmail(`${slug}@nubi.ai`),
    username,
    displayName: seed.name,
    bio: seed.bio,
    avatarUrl: `https://api.dicebear.com/8.x/glass/svg?seed=${encodeURIComponent(avatarSeed)}`,
    category: seed.category,
    personaPrompt: seed.personaPrompt,
    avatarSeed,
    contentModes: ["text", "image_post"],
    postFrequencyMinutes: 45 + index * 10,
    maxPostsPerDay: 6,
    personalityType: seed.personalityType,
    tone: seed.tone,
    engagementStyle: seed.engagementStyle
    ,
    visualStyle: seed.visualStyle
  };
}

export function resolveAiUserStyle(agent: Pick<AIAgentRecord, "slug" | "handle" | "internalOnlyNotes">): AiUserStyle {
  const noteStyle = parseStyleFromInternalNotes(agent.internalOnlyNotes);
  if (noteStyle) {
    return noteStyle;
  }

  const profile =
    AI_USER_SEEDS.find((seed) => makeUsernameCandidate(seed.handle) === agent.slug) ??
    AI_USER_SEEDS.find((seed) => normalizeUsername(seed.handle) === normalizeUsername(agent.handle));

  if (profile) {
    return {
      personalityType: profile.personalityType,
      tone: profile.tone,
      engagementStyle: profile.engagementStyle
    };
  }

  return {
    personalityType: "observant",
    tone: "casual and readable",
    engagementStyle: "joins conversations without dragging them out"
  };
}

export function isGeneratedAiUser(agent: Pick<AIAgentRecord, "internalOnlyNotes">) {
  const parsed = parseInternalNotes(agent.internalOnlyNotes);
  return parsed?.source === "generated-ai-user";
}

export function resolveAiVisualStyle(
  agent: Pick<AIAgentRecord, "slug" | "handle" | "internalOnlyNotes">
): AiUserVisualStyle {
  const parsed = parseInternalNotes(agent.internalOnlyNotes);
  if (parsed?.visualStyle) {
    return parsed.visualStyle;
  }

  const profile =
    AI_USER_SEEDS.find((seed) => makeUsernameCandidate(seed.handle) === agent.slug) ??
    AI_USER_SEEDS.find((seed) => normalizeUsername(seed.handle) === normalizeUsername(agent.handle));

  return (
    profile?.visualStyle ?? {
      archetype: "social native",
      subject: "an attractive adult person, 21+, photoreal and clearly mature",
      framing: "casual phone-camera portrait, slightly imperfect and off-center",
      wardrobe: "current real-world casual style with some personality",
      accessories: "optional glasses, hat, or jewelry depending on the vibe",
      expression: "natural and unforced",
      setting: "real room, street, or mirror with lived-in detail",
      allure: "socially attractive, current, and non-explicit"
    }
  );
}

export function buildAiVoiceGuidance(style: AiUserStyle) {
  const examplesByType: Record<AiPersonalityType, string[]> = {
    troll: ["yall just be saying anything", "be serious for one second", "this got me crying"],
    motivational: ["stay consistent, results coming", "small work stacks up fast", "be honest, would you keep this routine?"],
    aggressive: ["nah this take is trash", "you cannot be serious", "be real, which side are you on here?"],
    observant: ["everybody sees it now", "the pattern is right there", "okay but would you actually reply to this?"],
    creative: ["the look is carrying", "this has real texture", "be honest, soft glam or clean girl?"],
    analytical: ["the signal is in the behavior", "that tradeoff matters more", "useful question: would you actually use this?"]
  };

  return [
    `Personality type: ${style.personalityType}.`,
    `Tone: ${style.tone}.`,
    `Engagement style: ${style.engagementStyle}.`,
    `Sample lines: ${examplesByType[style.personalityType].join(" | ")}.`
  ].join(" ");
}

async function getAvailableUsername(baseUsername: string) {
  const normalizedBase = normalizeUsername(baseUsername);
  const existing = await getUserByUsername(normalizedBase);
  if (!existing) {
    return normalizedBase;
  }

  for (let index = 2; index < 200; index += 1) {
    const candidate = normalizeUsername(
      `${normalizedBase.slice(0, Math.max(3, 24 - String(index).length))}${index}`
    );
    const taken = await getUserByUsername(candidate);
    if (!taken) {
      return candidate;
    }
  }

  return normalizeUsername(`${normalizedBase.slice(0, 18)}${crypto.randomUUID().slice(0, 6)}`);
}

async function ensureAiUserAvatar(input: {
  slug: string;
  displayName: string;
  bio: string;
  category: string;
  personaPrompt: string;
  visualStyle: AiUserVisualStyle;
  existingAvatarUrl: string | null;
  forceRefresh: boolean;
}) {
  if (!input.forceRefresh && input.existingAvatarUrl && !isPlaceholderAvatar(input.existingAvatarUrl)) {
    return input.existingAvatarUrl;
  }

  try {
    const prompt = [
      `Create a realistic social profile photo for ${input.displayName}.`,
      `Category: ${input.category}.`,
      `Bio: ${input.bio}`,
      `Visual archetype: ${input.visualStyle.archetype}.`,
      `Framing: ${input.visualStyle.framing}.`,
      `Wardrobe: ${input.visualStyle.wardrobe}.`,
      `Accessories: ${input.visualStyle.accessories}.`,
      `Expression: ${input.visualStyle.expression}.`,
      `Setting: ${input.visualStyle.setting}.`,
      `Allure: ${input.visualStyle.allure}.`,
      "The image should feel like a real adult person on a social app, not a corporate headshot. Prioritize photoreal beauty, flattering structure, believable styling, natural skin texture, and a phone-camera sense of reality.",
      "The subject must read as clearly 21+ and must remain non-explicit.",
      "No text, no logos, no collage, no watermark.",
      input.personaPrompt
    ].join(" ");

    const image = await getAIAdapter().generateImage({
      prompt,
      style: "social profile portrait",
      mood: "confident"
    });

    if (!image?.url?.startsWith("data:")) {
      return input.existingAvatarUrl;
    }

    const saved = await saveGeneratedDataUrl({
      filenamePrefix: `${input.slug}-avatar`,
      dataUrl: image.url
    });

    return saved.url;
  } catch {
      return input.existingAvatarUrl;
  }
}

function isPlaceholderAvatar(value: string) {
  return value.includes("api.dicebear.com");
}

function parseStyleFromInternalNotes(value: string | null): AiUserStyle | null {
  const parsed = parseInternalNotes(value);
  if (parsed?.personalityType && parsed.tone && parsed.engagementStyle) {
    return {
      personalityType: parsed.personalityType,
      tone: parsed.tone,
      engagementStyle: parsed.engagementStyle
    };
  }

  return null;
}

function parseInternalNotes(value: string | null): Partial<AiUserInternalNotes> | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as Partial<AiUserInternalNotes>;
  } catch {}

  return null;
}

async function ensureAiFollowGraph(agents: AIAgentRecord[]) {
  const orderedAgents = [...agents].sort((left, right) => left.slug.localeCompare(right.slug));

  for (const agent of orderedAgents) {
    const others = orderedAgents.filter((item) => item.id !== agent.id);
    if (others.length === 0) {
      continue;
    }

    const desiredCount = Math.min(others.length, 3 + (Math.abs(hashCode(agent.slug)) % 4));
    const offset = Math.abs(hashCode(`${agent.slug}:follows`)) % others.length;

    for (let index = 0; index < desiredCount; index += 1) {
      const target = others[(offset + index) % others.length];
      if (!target || target.linkedUserId === agent.linkedUserId) {
        continue;
      }

      const existing = await get<{ follower_id: string }>(
        `SELECT follower_id FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1`,
        [agent.linkedUserId, target.linkedUserId]
      );

      if (!existing) {
        await run(`INSERT INTO follows (follower_id, following_id) VALUES (?, ?)`, [
          agent.linkedUserId,
          target.linkedUserId
        ]);
      }
    }
  }
}

function hashCode(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

export const ARENA_FIGHTERS = [
  {
    slug: "kairosterling",
    legacySlug: "nova_tech",
    handle: "@kairosterling",
    name: "Kairo Sterling",
    tag: "Tech & AI",
    role: "AI, Chips & Frontier Tech Radar",
    stance: "Breaking Tech & AI News",
    bio: "Tracking breaking AI releases, open-source models, robotics, chips, and the startups rewriting software.",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-2.jpg",
    videoUrl: "/cinematic/pulse-loop.mp4",
    accentClass:
      "border-sky-400/35 bg-[linear-gradient(145deg,rgba(14,165,233,0.18),rgba(10,12,24,0.92))] text-sky-200 hover:border-sky-400/70",
    dotClass: "bg-sky-400 shadow-[0_0_10px_#38bdf8]"
  },
  {
    slug: "marcusvance",
    legacySlug: "nova_hype",
    handle: "@marcusvance",
    name: "Marcus Vance",
    tag: "Founder",
    role: "Builder & Venture Insider",
    stance: "Early-Stage & Momentum",
    bio: "Founder, angel & builder. Betting on ambitious people, asymmetric upside, and category-defining speed.",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-1.jpg",
    videoUrl: "/cinematic/hero-loop.mp4",
    accentClass:
      "border-amber-400/35 bg-[linear-gradient(145deg,rgba(245,158,11,0.16),rgba(10,12,24,0.92))] text-amber-200 hover:border-amber-400/70",
    dotClass: "bg-amber-400 shadow-[0_0_10px_#fbbf24]"
  },
  {
    slug: "elenarostova",
    legacySlug: "nova_purist",
    handle: "@elenarostova",
    name: "Elena Rostova",
    tag: "Architect",
    role: "Systems & Deep Tech",
    stance: "Engineering & Scale",
    bio: "Systems architect & infrastructure lead. Real mechanics, unit economics, and execution over hype.",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-2.jpg",
    videoUrl: "/cinematic/pulse-loop.mp4",
    accentClass:
      "border-cyan-400/35 bg-[linear-gradient(145deg,rgba(6,182,212,0.16),rgba(10,12,24,0.92))] text-cyan-200 hover:border-cyan-400/70",
    dotClass: "bg-cyan-400 shadow-[0_0_10px_#22d3ee]"
  },
  {
    slug: "jaxmercer",
    legacySlug: "nova_advocate",
    handle: "@jaxmercer",
    name: "Jax Mercer",
    tag: "Critic",
    role: "Strategy & Counter-Culture",
    stance: "Unfiltered Takes",
    bio: "Strategist & cultural critic. Cutting through consensus narratives and saying the quiet part out loud.",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-3.jpg",
    videoUrl: "/cinematic/culture-loop.mp4",
    accentClass:
      "border-purple-400/35 bg-[linear-gradient(145deg,rgba(168,85,247,0.18),rgba(10,12,24,0.92))] text-purple-200 hover:border-purple-400/70",
    dotClass: "bg-purple-400 shadow-[0_0_10px_#c084fc]"
  },
  {
    slug: "sorenvale",
    legacySlug: "nova_director",
    handle: "@sorenvale",
    name: "Soren Vale",
    tag: "Curator",
    role: "Editorial & Trend Pulse",
    stance: "Culture & Media",
    bio: "Editor & trend curator. Connecting the dots across music, street culture, design, and next-gen media.",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-4.jpg",
    videoUrl: "/cinematic/creator-loop.mp4",
    accentClass:
      "border-emerald-400/35 bg-[linear-gradient(145deg,rgba(16,185,129,0.16),rgba(10,12,24,0.92))] text-emerald-200 hover:border-emerald-400/70",
    dotClass: "bg-emerald-400 shadow-[0_0_10px_#34d399]"
  }
];

export const CINEMATIC_TOPICS = [
  {
    id: "ai-tech-radar",
    eyebrow: "TECH & AI // BREAKING",
    label: "Open-Source AI vs. Big Tech Frontier Labs",
    headline: "THE AI ARMS RACE",
    subcopy:
      "Local open-weight models and autonomous agents are closing the gap with trillion-dollar cloud labs.",
    topicPrompt:
      "#tech #ai Are fast local open-source AI models and autonomous agents about to overtake closed Big Tech cloud APIs?",
    videoUrl: "/cinematic/pulse-loop.mp4",
    imageUrl: "/cinematic/shot-2.jpg",
    tag: "#ai"
  },
  {
    id: "street-culture",
    eyebrow: "CULTURE // LIVE WAVE",
    label: "Future of Streetwear & Brand Worlds",
    headline: "BRAND WORLDS OVER LOGOS",
    subcopy:
      "Why independent culture houses with cinematic worlds are replacing legacy luxury labels.",
    topicPrompt:
      "Is the future of streetwear & independent brands built on cinematic digital worlds or physical scarcity?",
    videoUrl: "/cinematic/culture-loop.mp4",
    imageUrl: "/cinematic/shot-3.jpg",
    tag: "#brandworlds"
  },
  {
    id: "creator-ownership",
    eyebrow: "MEDIA // OWNERSHIP",
    label: "Independent Creators vs. Big Platforms",
    headline: "OWN THE AUDIENCE",
    subcopy:
      "One-person studios and direct community platforms are out-executing $50M media networks.",
    topicPrompt:
      "Are solo creators and independent studios about to make traditional media labels obsolete?",
    videoUrl: "/cinematic/creator-loop.mp4",
    imageUrl: "/cinematic/shot-1.jpg",
    tag: "#creators"
  },
  {
    id: "night-economy",
    eyebrow: "SOUND // VISUALS",
    label: "Music, Nightlife & Visual Identity",
    headline: "SOUND MEETS CINEMA",
    subcopy:
      "Every drop needs a soundtrack and a visual universe. Static posts don't move culture anymore.",
    topicPrompt:
      "Does every great cultural movement today require both a signature sound and a visual film language?",
    videoUrl: "/cinematic/hero-loop.mp4",
    imageUrl: "/cinematic/shot-4.jpg",
    tag: "#soundandvision"
  }
];

export const TECH_RADAR_TOPICS = [
  {
    id: "open-models",
    eyebrow: "01 // AI MODELS",
    headline: "LOCAL AI VS. CLOUD GIANTS",
    subcopy:
      "Compact open-weight models running on consumer GPUs are challenging $100B cloud data centers.",
    topicPrompt:
      "#tech #ai Breaking down the latest shift in AI models: why small, fast models running on local hardware are beating bloated cloud wrappers.",
    videoUrl: "/cinematic/pulse-loop.mp4",
    imageUrl: "/cinematic/shot-2.jpg",
    tag: "#aimodels"
  },
  {
    id: "autonomous-agents",
    eyebrow: "02 // AI AGENTS",
    headline: "AUTONOMOUS SOFTWARE AGENTS",
    subcopy:
      "We are moving from chatbots that talk to AI agents that write code, run workflows, and ship products.",
    topicPrompt:
      "#tech #ai Autonomous AI agents that execute full workflows are replacing standard SaaS dashboards—who wins and who gets wiped out?",
    videoUrl: "/cinematic/hero-loop.mp4",
    imageUrl: "/cinematic/shot-1.jpg",
    tag: "#agents"
  },
  {
    id: "chips-robotics",
    eyebrow: "03 // HARDWARE & ROBOTICS",
    headline: "SILICON, GPUS & HUMANOIDS",
    subcopy:
      "Next-gen AI chips, edge compute, and general-purpose robotics stepping out of the lab.",
    topicPrompt:
      "#tech #ai Between custom AI silicon and humanoid robotics, where is the biggest real-world hardware breakthrough happening right now?",
    videoUrl: "/cinematic/creator-loop.mp4",
    imageUrl: "/cinematic/shot-4.jpg",
    tag: "#hardware"
  },
  {
    id: "one-person-unicorn",
    eyebrow: "04 // NEXT-GEN STARTUPS",
    headline: "3-PERSON AI UNICORNS",
    subcopy:
      "Tiny engineering teams with AI leverage are shipping faster than 500-person legacy tech companies.",
    topicPrompt:
      "#tech #ai Can a 3-person technical team armed with modern AI tools realistically out-build a 300-person legacy software company?",
    videoUrl: "/cinematic/culture-loop.mp4",
    imageUrl: "/cinematic/shot-3.jpg",
    tag: "#startups"
  }
];

const VOICE_MAP: Record<
  string,
  {
    username: string;
    displayName: string;
    badgeLabel: string;
    avatarUrl: string;
    coverImageUrl: string;
    videoUrl: string;
    className: string;
    cardAccent: string;
  }
> = {
  kairosterling: {
    username: "kairosterling",
    displayName: "Kairo Sterling",
    badgeLabel: "Tech & AI",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-2.jpg",
    videoUrl: "/cinematic/pulse-loop.mp4",
    className: "border-sky-400/35 bg-sky-500/12 text-sky-200",
    cardAccent: "border-l-2 border-l-sky-400/75 bg-sky-500/[0.04]"
  },
  nova_tech: {
    username: "kairosterling",
    displayName: "Kairo Sterling",
    badgeLabel: "Tech & AI",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-2.jpg",
    videoUrl: "/cinematic/pulse-loop.mp4",
    className: "border-sky-400/35 bg-sky-500/12 text-sky-200",
    cardAccent: "border-l-2 border-l-sky-400/75 bg-sky-500/[0.04]"
  },
  marcusvance: {
    username: "marcusvance",
    displayName: "Marcus Vance",
    badgeLabel: "Founder",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-1.jpg",
    videoUrl: "/cinematic/hero-loop.mp4",
    className: "border-amber-400/35 bg-amber-500/12 text-amber-200",
    cardAccent: "border-l-2 border-l-amber-400/75 bg-amber-500/[0.04]"
  },
  nova_hype: {
    username: "marcusvance",
    displayName: "Marcus Vance",
    badgeLabel: "Founder",
    avatarUrl:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-1.jpg",
    videoUrl: "/cinematic/hero-loop.mp4",
    className: "border-amber-400/35 bg-amber-500/12 text-amber-200",
    cardAccent: "border-l-2 border-l-amber-400/75 bg-amber-500/[0.04]"
  },
  elenarostova: {
    username: "elenarostova",
    displayName: "Elena Rostova",
    badgeLabel: "Architect",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-2.jpg",
    videoUrl: "/cinematic/pulse-loop.mp4",
    className: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200",
    cardAccent: "border-l-2 border-l-cyan-400/75 bg-cyan-500/[0.04]"
  },
  nova_purist: {
    username: "elenarostova",
    displayName: "Elena Rostova",
    badgeLabel: "Architect",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-2.jpg",
    videoUrl: "/cinematic/pulse-loop.mp4",
    className: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200",
    cardAccent: "border-l-2 border-l-cyan-400/75 bg-cyan-500/[0.04]"
  },
  jaxmercer: {
    username: "jaxmercer",
    displayName: "Jax Mercer",
    badgeLabel: "Critic",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-3.jpg",
    videoUrl: "/cinematic/culture-loop.mp4",
    className: "border-purple-400/35 bg-purple-500/12 text-purple-200",
    cardAccent: "border-l-2 border-l-purple-400/75 bg-purple-500/[0.04]"
  },
  nova_advocate: {
    username: "jaxmercer",
    displayName: "Jax Mercer",
    badgeLabel: "Critic",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-3.jpg",
    videoUrl: "/cinematic/culture-loop.mp4",
    className: "border-purple-400/35 bg-purple-500/12 text-purple-200",
    cardAccent: "border-l-2 border-l-purple-400/75 bg-purple-500/[0.04]"
  },
  sorenvale: {
    username: "sorenvale",
    displayName: "Soren Vale",
    badgeLabel: "Curator",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-4.jpg",
    videoUrl: "/cinematic/creator-loop.mp4",
    className: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200",
    cardAccent: "border-l-2 border-l-emerald-400/75 bg-emerald-500/[0.04]"
  },
  nova_director: {
    username: "sorenvale",
    displayName: "Soren Vale",
    badgeLabel: "Curator",
    avatarUrl:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=85",
    coverImageUrl: "/cinematic/shot-4.jpg",
    videoUrl: "/cinematic/creator-loop.mp4",
    className: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200",
    cardAccent: "border-l-2 border-l-emerald-400/75 bg-emerald-500/[0.04]"
  }
};

export function resolvePublicVoiceIdentity(
  username: string,
  displayName: string,
  existingAvatarUrl?: string | null
) {
  const lower = username.trim().toLowerCase();
  const mapped = VOICE_MAP[lower];
  if (mapped) {
    return {
      username: mapped.username,
      displayName: mapped.displayName,
      avatarUrl: existingAvatarUrl || mapped.avatarUrl,
      coverImageUrl: mapped.coverImageUrl,
      videoUrl: mapped.videoUrl
    };
  }
  return {
    username,
    displayName: displayName.replace(/^Nova\s*\/\/\s*/i, ""),
    avatarUrl: existingAvatarUrl ?? null,
    coverImageUrl: null,
    videoUrl: null
  };
}

export function sanitizePublicVoiceText(text: string | null | undefined): string {
  if (!text) {
    return "";
  }
  return text
    .replace(/@nova_tech\b/gi, "@kairosterling")
    .replace(/@nova_hype\b/gi, "@marcusvance")
    .replace(/@nova_purist\b/gi, "@elenarostova")
    .replace(/@nova_advocate\b/gi, "@jaxmercer")
    .replace(/@nova_director\b/gi, "@sorenvale")
    .replace(/Nova\s*\/\/\s*The Hype-Man/gi, "Marcus Vance")
    .replace(/Nova\s*\/\/\s*The Tech Purist/gi, "Elena Rostova")
    .replace(/Nova\s*\/\/\s*Devil's Advocate/gi, "Jax Mercer")
    .replace(/Nova\s*\/\/\s*Executive Director/gi, "Soren Vale");
}

export function getPersonaBadgeMeta(username: string) {
  const lower = username.trim().toLowerCase();
  const mapped = VOICE_MAP[lower];
  if (mapped) {
    return {
      label: mapped.badgeLabel,
      avatarUrl: mapped.avatarUrl,
      coverImageUrl: mapped.coverImageUrl,
      videoUrl: mapped.videoUrl,
      className: mapped.className,
      cardAccent: mapped.cardAccent
    };
  }
  return null;
}

export function isAutomatedVoiceUsername(username: string) {
  const lower = username.trim().toLowerCase();
  return Boolean(VOICE_MAP[lower] || lower.startsWith("nova_"));
}

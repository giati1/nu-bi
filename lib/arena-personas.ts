export const ARENA_FIGHTERS = [
  {
    slug: "marcusvance",
    legacySlug: "nova_hype",
    handle: "@marcusvance",
    name: "Marcus Vance",
    tag: "Founder",
    role: "Builder & Venture Insider",
    stance: "Early-Stage & Momentum",
    bio: "Founder, angel & builder. Betting on ambitious people and asymmetric upside.",
    accentClass:
      "border-amber-400/30 bg-[linear-gradient(145deg,rgba(245,158,11,0.14),rgba(10,12,24,0.88))] text-amber-200 hover:border-amber-400/60",
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
    bio: "Systems architect. Real mechanics, scale, and execution over hype.",
    accentClass:
      "border-cyan-400/30 bg-[linear-gradient(145deg,rgba(6,182,212,0.14),rgba(10,12,24,0.88))] text-cyan-200 hover:border-cyan-400/60",
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
    bio: "Strategist & cultural critic. Saying the quiet part out loud.",
    accentClass:
      "border-purple-400/30 bg-[linear-gradient(145deg,rgba(168,85,247,0.16),rgba(10,12,24,0.88))] text-purple-200 hover:border-purple-400/60",
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
    bio: "Editor & trend curator. Connecting the dots across tech, media, and culture.",
    accentClass:
      "border-emerald-400/30 bg-[linear-gradient(145deg,rgba(16,185,129,0.14),rgba(10,12,24,0.88))] text-emerald-200 hover:border-emerald-400/60",
    dotClass: "bg-emerald-400 shadow-[0_0_10px_#34d399]"
  }
];

const VOICE_MAP: Record<
  string,
  {
    username: string;
    displayName: string;
    badgeLabel: string;
    className: string;
    cardAccent: string;
  }
> = {
  marcusvance: {
    username: "marcusvance",
    displayName: "Marcus Vance",
    badgeLabel: "Founder",
    className: "border-amber-400/35 bg-amber-500/12 text-amber-200",
    cardAccent: "border-l-2 border-l-amber-400/75 bg-amber-500/[0.04]"
  },
  nova_hype: {
    username: "marcusvance",
    displayName: "Marcus Vance",
    badgeLabel: "Founder",
    className: "border-amber-400/35 bg-amber-500/12 text-amber-200",
    cardAccent: "border-l-2 border-l-amber-400/75 bg-amber-500/[0.04]"
  },
  elenarostova: {
    username: "elenarostova",
    displayName: "Elena Rostova",
    badgeLabel: "Architect",
    className: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200",
    cardAccent: "border-l-2 border-l-cyan-400/75 bg-cyan-500/[0.04]"
  },
  nova_purist: {
    username: "elenarostova",
    displayName: "Elena Rostova",
    badgeLabel: "Architect",
    className: "border-cyan-400/35 bg-cyan-500/12 text-cyan-200",
    cardAccent: "border-l-2 border-l-cyan-400/75 bg-cyan-500/[0.04]"
  },
  jaxmercer: {
    username: "jaxmercer",
    displayName: "Jax Mercer",
    badgeLabel: "Critic",
    className: "border-purple-400/35 bg-purple-500/12 text-purple-200",
    cardAccent: "border-l-2 border-l-purple-400/75 bg-purple-500/[0.04]"
  },
  nova_advocate: {
    username: "jaxmercer",
    displayName: "Jax Mercer",
    badgeLabel: "Critic",
    className: "border-purple-400/35 bg-purple-500/12 text-purple-200",
    cardAccent: "border-l-2 border-l-purple-400/75 bg-purple-500/[0.04]"
  },
  sorenvale: {
    username: "sorenvale",
    displayName: "Soren Vale",
    badgeLabel: "Curator",
    className: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200",
    cardAccent: "border-l-2 border-l-emerald-400/75 bg-emerald-500/[0.04]"
  },
  nova_director: {
    username: "sorenvale",
    displayName: "Soren Vale",
    badgeLabel: "Curator",
    className: "border-emerald-400/35 bg-emerald-500/12 text-emerald-200",
    cardAccent: "border-l-2 border-l-emerald-400/75 bg-emerald-500/[0.04]"
  }
};

export function resolvePublicVoiceIdentity(username: string, displayName: string) {
  const lower = username.trim().toLowerCase();
  const mapped = VOICE_MAP[lower];
  if (mapped) {
    return {
      username: mapped.username,
      displayName: mapped.displayName
    };
  }
  return {
    username,
    displayName: displayName.replace(/^Nova\s*\/\/\s*/i, "")
  };
}

export function sanitizePublicVoiceText(text: string | null | undefined): string {
  if (!text) {
    return "";
  }
  return text
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

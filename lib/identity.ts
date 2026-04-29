export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

export function makeUsernameCandidate(value: string) {
  const candidate = normalizeUsername(value)
    .replace(/[^a-z0-9._]+/g, ".")
    .replace(/[._]{2,}/g, ".")
    .replace(/^[._]+|[._]+$/g, "")
    .slice(0, 24);

  return candidate.length >= 3 ? candidate : "nubiuser";
}

export function getProfileHref(username?: string | null) {
  const trimmed = username?.trim();
  if (!trimmed) {
    return null;
  }

  const normalized = normalizeUsername(trimmed);
  if (!normalized) {
    return null;
  }

  return `/profile/${encodeURIComponent(normalized)}`;
}

export function resolveStoryDestinationPath(input: {
  destinationPath?: string | null;
  authorUsername?: string | null;
}) {
  const destinationPath = input.destinationPath?.trim() ?? "";
  if (!destinationPath) {
    return getProfileHref(input.authorUsername);
  }

  if (destinationPath.startsWith("/profile/")) {
    return getProfileHref(input.authorUsername);
  }

  return destinationPath;
}

import { upsertAIAgent } from "@/lib/db/ai-repository";
import { createUser, getUserByEmail } from "@/lib/db/repository";
import { run } from "@/lib/db/client";
import {
  platformAIAgentDefinitions,
  type PlatformAIAgentDefinition
} from "@/lib/ai-agents/registry";

export async function ensurePlatformAIAgents(passwordHash: string) {
  const agents = [];

  for (const definition of platformAIAgentDefinitions) {
    agents.push(await ensurePlatformAIAgentDefinition(definition, passwordHash));
  }

  return agents;
}

export async function ensurePlatformAIAgentBySlug(slug: string, passwordHash: string) {
  const definition = platformAIAgentDefinitions.find((item) => item.slug === slug);
  if (!definition) {
    throw new Error(`Unknown AI agent slug: ${slug}`);
  }

  return await ensurePlatformAIAgentDefinition(definition, passwordHash);
}

async function ensurePlatformAIAgentDefinition(
  definition: PlatformAIAgentDefinition,
  passwordHash: string
) {
  const existingUser = await getUserByEmail(definition.email);
  const user =
    existingUser ??
    (await createUser({
      email: definition.email,
      username: definition.username,
      displayName: definition.displayName,
      passwordHash
    }));

  if (!user) {
    throw new Error(`Could not create AI platform user for ${definition.slug}.`);
  }

  await run(
    `UPDATE profiles
     SET bio = ?, location = ?, website = COALESCE(website, ?), is_private = 0, updated_at = CURRENT_TIMESTAMP
     WHERE user_id = ?`,
    [definition.description, "Platform", "https://nubi.local/ai-agents", user.id]
  );

  return await upsertAIAgent({
    linkedUserId: user.id,
    slug: definition.slug,
    displayName: definition.displayName,
    handle: definition.username,
    category: definition.category,
    personaPrompt: definition.personaPrompt,
    description: definition.description,
    avatarSeed: definition.avatarSeed,
    contentModes: definition.contentModes,
    postFrequencyMinutes: definition.postFrequencyMinutes,
    maxPostsPerDay: definition.maxPostsPerDay,
    enabled: true,
    internalOnlyNotes: definition.internalOnlyNotes
  });
}

import { upsertAIAgent } from "@/lib/db/ai-repository";
import { createUser, getUserByEmail } from "@/lib/db/repository";
import { run } from "@/lib/db/client";
import { platformAIAgentDefinitions } from "@/lib/ai-agents/registry";

export async function ensurePlatformAIAgents(passwordHash: string) {
  const agents = [];

  for (const definition of platformAIAgentDefinitions) {
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

    const agent = await upsertAIAgent({
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

    agents.push(agent);
  }

  return agents;
}

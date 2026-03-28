import { hashPassword } from "../lib/auth/password";
import { ensureDatabase, run } from "../lib/db/client";
import {
  addComment,
  createPost,
  createUser,
  getUserByEmail,
  sendMessage,
  toggleFollow,
  toggleLike
} from "../lib/db/repository";

async function main() {
  await ensureDatabase();

  const passwordHash = await hashPassword("Password123!");

  const aria =
    (await getUserByEmail("aria@nubi.com")) ??
    (await createUser({
      email: "aria@nubi.com",
      username: "aria",
      displayName: "Aria Vale",
      passwordHash
    }));
  const kade =
    (await getUserByEmail("kade@nubi.com")) ??
    (await createUser({
      email: "kade@nubi.com",
      username: "kade",
      displayName: "Kade North",
      passwordHash
    }));
  const lina =
    (await getUserByEmail("lina@nubi.com")) ??
    (await createUser({
      email: "lina@nubi.com",
      username: "lina",
      displayName: "Lina Morrow",
      passwordHash
    }));
  const nubi =
    (await getUserByEmail("master@nubi.com")) ??
    (await createUser({
      email: "master@nubi.com",
      username: "nubi",
      displayName: "NOMI",
      passwordHash
    }));

  if (!aria || !kade || !lina || !nubi) {
    throw new Error("Seed users could not be created.");
  }

  await run(`UPDATE profiles SET bio = ?, location = ? WHERE user_id = ?`, [
    "Building social products with an eye for signal and culture.",
    "Los Angeles",
    aria.id
  ]);
  await run(`UPDATE profiles SET bio = ?, location = ? WHERE user_id = ?`, [
    "Shipping design systems, message flows, and growth loops.",
    "New York",
    kade.id
  ]);
  await run(`UPDATE profiles SET bio = ?, location = ? WHERE user_id = ?`, [
    "Founder mode, creator tools, and AI product research.",
    "San Francisco",
    lina.id
  ]);
  await run(`UPDATE profiles SET bio = ?, location = ?, website = ?, is_private = 0 WHERE user_id = ?`, [
    "Official NOMI account for platform-wide announcements, launches, creator spotlights, and public updates.",
    "Global",
    "https://knowme.nu-bi.com",
    nubi.id
  ]);

  await toggleFollow(kade.id, aria.id);
  await toggleFollow(lina.id, aria.id);
  await toggleFollow(aria.id, kade.id);
  await toggleFollow(nubi.id, aria.id);
  await toggleFollow(nubi.id, kade.id);
  await toggleFollow(nubi.id, lina.id);

  const postOne = await createPost({
    userId: kade.id,
    body: "NOMI should feel fast, cinematic, and socially native on the very first screen."
  });
  const postTwo = await createPost({
    userId: lina.id,
    body: "MVP priority: identity, feed quality, DM polish, then AI hooks sitting cleanly behind product seams."
  });
  await createPost({
    userId: nubi.id,
    body: "Welcome to the official NOMI account. Use this profile for platform announcements, public drops, and updates everyone should see."
  });

  if (postOne) {
    await toggleLike(postOne.id, aria.id);
    await addComment({
      postId: postOne.id,
      viewerId: aria.id,
      body: "This is the right bar. Feed quality and perceived polish matter immediately."
    });
  }

  if (postTwo) {
    await toggleLike(postTwo.id, kade.id);
  }

  await sendMessage({
    senderId: aria.id,
    recipientId: kade.id,
    body: "We should keep the tunnel mapped to localhost:8000 while we validate the Next app locally."
  });
  await sendMessage({
    senderId: kade.id,
    recipientId: aria.id,
    body: "Agreed. Once the storage and D1 bindings are live, we can point the same hostname at the Cloudflare deploy."
  });

  console.log("NOMI seed data created.");
}

void main();

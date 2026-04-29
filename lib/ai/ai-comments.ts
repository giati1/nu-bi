import { buildAiVoiceGuidance, resolveAiUserStyle } from "@/lib/ai/ai-users";
import { generateVoiceComment } from "@/lib/ai/ai-voice";
import { getAIAdapter } from "@/lib/ai";
import { all, get } from "@/lib/db/client";
import {
  addComment,
  getCommentsForPost,
  getDiscoveryFeed,
  toggleLike
} from "@/lib/db/repository";
import type { AIAgentRecord, CommentRecord, FeedPost } from "@/types/domain";

const COMMENT_FALLBACKS_BY_PERSONALITY = {
  troll: ["yall just be saying anything", "nah this is crazy", "be serious please"],
  motivational: ["stay consistent, results coming", "small work stacks up", "this is lowkey facts"],
  aggressive: ["nah this take is trash", "that logic weak", "you lost me immediately"],
  observant: ["everybody sees this now", "the pattern is obvious", "real spill"],
  creative: ["the vibe is there", "this actually looks clean", "okay this got texture"],
  analytical: ["the signal is in that", "that tradeoff matters", "this is the real point"]
} as const;

const REACTION_COMMENTS = ["fire", "heart", "flames", "big heart"] as const;

type ReplyTarget = {
  post: FeedPost;
  parentComment: CommentRecord;
  chainRootId: string;
};

export async function generateComment(input: { post: FeedPost; user: AIAgentRecord }) {
  const style = resolveAiUserStyle(input.user);
  const body = input.post.body.trim().slice(0, 240) || "clean post";
  const generated = await getAIAdapter().generateAgentContent({
    systemPrompt: [
      input.user.personaPrompt,
      buildAiVoiceGuidance(style),
      "Write one short social reply to someone else's post.",
      "Keep it under 32 words.",
      "Let the thought land fully instead of cutting it off mid-sentence.",
      "No hashtags. No quotes. No formal tone."
    ].join(" "),
    userPrompt: `Reply to this post in a casual, native social tone:\n${body}`,
    contentMode: "text",
    topicSeed: body.slice(0, 80)
  });

  const normalized = normalizeComment(generated.body);
  return normalized || pickFallbackComment(style.personalityType, input.user.slug, body);
}

export async function generateReply(input: {
  post: FeedPost;
  parentComment: CommentRecord;
  user: AIAgentRecord;
  recentComments?: CommentRecord[];
}) {
  const style = resolveAiUserStyle(input.user);
  const replyModes = ["agreement", "disagreement", "joke", "follow-up"] as const;
  const replyMode = replyModes[Math.floor(Math.random() * replyModes.length)] ?? "agreement";
  const recentConversation = (input.recentComments ?? [])
    .slice(-6)
    .map((comment) => `${comment.author.displayName}: ${comment.body || "[attachment]"}`)
    .join("\n");
  const generated = await getAIAdapter().generateAgentContent({
    systemPrompt: [
      input.user.personaPrompt,
      buildAiVoiceGuidance(style),
      `Write one short social reply in ${replyMode} mode.`,
      "Match the energy of the parent comment.",
      "Keep it under 28 words.",
      "Finish the thought cleanly instead of trailing off.",
      "No hashtags. No formal tone. No emoji spam."
    ].join(" "),
    userPrompt: [
      `Post: ${input.post.body.trim().slice(0, 180) || "short post"}`,
      `Parent comment: ${input.parentComment.body.trim().slice(0, 120) || "short comment"}`,
      recentConversation ? `Recent conversation:\n${recentConversation}` : null
    ]
      .filter(Boolean)
      .join("\n"),
    contentMode: "text",
    topicSeed: `${replyMode}:${input.post.id}`
  });

  const normalized = normalizeComment(generated.body);
  return normalized || pickFallbackReply(style.personalityType, replyMode);
}

export async function runAiCommentPass(input: {
  allAgents: AIAgentRecord[];
  postedAgentIds?: string[];
}) {
  const availableAgents = shuffle(
    input.allAgents.filter((agent) => !input.postedAgentIds?.includes(agent.id))
  );
  const targetCount = Math.min(
    availableAgents.length,
    Math.max(2, Math.min(5, availableAgents.length === 0 ? 0 : Math.floor(Math.random() * 4) + 2))
  );

  const selectedAgents = availableAgents.slice(0, targetCount);
  const combinedRecentPosts = await collectRecentPosts(selectedAgents);
  const hotPosts = pickHotPosts(combinedRecentPosts);
  const hotPostIds = new Set(hotPosts.map((post) => post.id));
  const followedIdsByAgent = new Map<string, Set<string>>();
  const usersWithVoiceNote = new Set<string>();
  let commentsCreated = 0;
  let likesCreated = 0;
  let voiceNotesCreated = 0;
  const interactedPostIds = new Set<string>(hotPosts.map((post) => post.id));

  for (const agent of selectedAgents) {
    const followedIds = await getFollowingIds(agent.linkedUserId);
    followedIdsByAgent.set(agent.id, followedIds);
    const feed = await getDiscoveryFeed(agent.linkedUserId);
    const candidates = rankCandidatePosts({
      posts: feed,
      agentUserId: agent.linkedUserId,
      followedIds,
      hotPostIds
    });

    for (const post of candidates.slice(0, 10)) {
      const alreadyCommented = await hasExistingTopLevelComment(agent.linkedUserId, post.id);
      const alreadyLiked = await hasExistingLike(agent.linkedUserId, post.id);

      if (!alreadyLiked && Math.random() < (hotPostIds.has(post.id) ? 0.85 : 0.55)) {
        await toggleLike(post.id, agent.linkedUserId);
        likesCreated += 1;
        interactedPostIds.add(post.id);
      }

      if (alreadyCommented) {
        continue;
      }

      const commentBody =
        Math.random() < (hotPostIds.has(post.id) ? 0.32 : 0.18)
          ? pickReactionComment(agent)
          : await generateComment({ post, user: agent });

      if (!commentBody.trim()) {
        continue;
      }

      const voiceNote = await maybeCreateVoiceNote({
        body: commentBody,
        agent,
        usersWithVoiceNote
      });

      await addComment(
        voiceNote
          ? {
              postId: post.id,
              viewerId: agent.linkedUserId,
              body: "",
              media: [voiceNote]
            }
          : {
              postId: post.id,
              viewerId: agent.linkedUserId,
              body: commentBody
            }
      );
      commentsCreated += 1;
      if (voiceNote) {
        voiceNotesCreated += 1;
      }
      interactedPostIds.add(post.id);
      break;
    }
  }

  const threadRepliesCreated = await runAiThreadPass({
    allAgents: selectedAgents,
    candidatePostIds: [...interactedPostIds],
    hotPostIds,
    followedIdsByAgent,
    usersWithVoiceNote
  });

  return {
    commentsCreated,
    likesCreated,
    threadRepliesCreated,
    voiceNotesCreated,
    usersSelected: selectedAgents.length,
    hotPostIds: [...hotPostIds]
  };
}

async function runAiThreadPass(input: {
  allAgents: AIAgentRecord[];
  candidatePostIds: string[];
  hotPostIds: Set<string>;
  followedIdsByAgent: Map<string, Set<string>>;
  usersWithVoiceNote: Set<string>;
}) {
  const replyBudget = Math.min(2, Math.max(1, input.candidatePostIds.length === 0 ? 0 : Math.floor(Math.random() * 2) + 1));
  if (replyBudget === 0) {
    return 0;
  }

  const agents = shuffle(input.allAgents);
  let repliesCreated = 0;
  const usedChainKeys = new Set<string>();
  const usedAgentIds = new Set<string>();

  for (const agent of agents) {
    if (repliesCreated >= replyBudget) {
      break;
    }
    if (usedAgentIds.has(agent.id)) {
      continue;
    }

    const followedIds = input.followedIdsByAgent.get(agent.id) ?? new Set<string>();
    const replyTargets = await collectReplyTargets({
      agent,
      candidatePostIds: input.candidatePostIds,
      hotPostIds: input.hotPostIds,
      followedIds
    });

    for (const target of replyTargets) {
      const chainKey = `${target.post.id}:${target.chainRootId}`;
      if (usedChainKeys.has(chainKey)) {
        continue;
      }

      const comments = await getCommentsForPost(target.post.id);
      if (hasUserInCommentChain(agent.linkedUserId, comments, target.parentComment.id)) {
        continue;
      }

      const replyBody = await generateReply({
        post: target.post,
        parentComment: target.parentComment,
        user: agent
      });

      if (!replyBody.trim()) {
        continue;
      }

      const voiceNote = await maybeCreateVoiceNote({
        body: replyBody,
        agent,
        usersWithVoiceNote: input.usersWithVoiceNote
      });

      await addComment(
        voiceNote
          ? {
              postId: target.post.id,
              viewerId: agent.linkedUserId,
              body: "",
              media: [voiceNote],
              parentCommentId: target.parentComment.id
            }
          : {
              postId: target.post.id,
              viewerId: agent.linkedUserId,
              body: replyBody,
              parentCommentId: target.parentComment.id
            }
      );
      usedChainKeys.add(chainKey);
      usedAgentIds.add(agent.id);
      repliesCreated += 1;
      break;
    }
  }

  return repliesCreated;
}

async function collectRecentPosts(agents: AIAgentRecord[]) {
  const postsById = new Map<string, FeedPost>();

  for (const agent of agents.slice(0, 4)) {
    const feed = await getDiscoveryFeed(agent.linkedUserId);
    for (const post of feed.slice(0, 12)) {
      if (post.status !== "published") {
        continue;
      }
      postsById.set(post.id, post);
    }
  }

  return [...postsById.values()];
}

function pickHotPosts(posts: FeedPost[]) {
  const recentPosts = posts
    .filter((post) => isRecent(post.createdAt, 72))
    .map((post) => ({
      post,
      score:
        post.commentCount * 3 +
        post.likeCount * 2 +
        post.repostCount * 3 +
        (isRecent(post.createdAt, 12) ? 2 : 0)
    }))
    .filter((item) => item.score >= 3)
    .sort((left, right) => right.score - left.score);

  return recentPosts.slice(0, 2).map((item) => item.post);
}

function rankCandidatePosts(input: {
  posts: FeedPost[];
  agentUserId: string;
  followedIds: Set<string>;
  hotPostIds: Set<string>;
}) {
  return shuffle(
    input.posts.filter((post) => post.author.id !== input.agentUserId && post.status === "published")
  ).sort((left, right) => scorePost(right, input.followedIds, input.hotPostIds) - scorePost(left, input.followedIds, input.hotPostIds));
}

async function collectReplyTargets(input: {
  agent: AIAgentRecord;
  candidatePostIds: string[];
  hotPostIds: Set<string>;
  followedIds: Set<string>;
}) {
  const feed = await getDiscoveryFeed(input.agent.linkedUserId);
  const feedById = new Map(feed.map((post) => [post.id, post]));
  const orderedIds = [
    ...input.candidatePostIds.filter((postId) => input.hotPostIds.has(postId)),
    ...shuffle(input.candidatePostIds.filter((postId) => !input.hotPostIds.has(postId)))
  ];
  const replyTargets: ReplyTarget[] = [];

  for (const postId of orderedIds) {
    const post = feedById.get(postId);
    if (!post || post.author.id === input.agent.linkedUserId) {
      continue;
    }

    const comments = await getCommentsForPost(post.id);
    const eligible = comments
      .filter((comment) => comment.author.id !== input.agent.linkedUserId)
      .filter((comment) => comment.depth < 2)
      .filter((comment) => Boolean(comment.body.trim()))
      .map((comment) => ({
        post,
        parentComment: comment,
        chainRootId: getChainRootId(comments, comment.id),
        priority:
          (input.hotPostIds.has(post.id) ? 4 : 0) +
          (input.followedIds.has(post.author.id) ? 3 : 0) +
          (input.followedIds.has(comment.author.id) ? 2 : 0) +
          (2 - comment.depth)
      }))
      .sort((left, right) => right.priority - left.priority);

    replyTargets.push(...eligible.slice(0, 3));
  }

  return shuffle(replyTargets);
}

async function hasExistingTopLevelComment(userId: string, postId: string) {
  const row = await get<{ id: string }>(
    `SELECT id
     FROM comments
     WHERE user_id = ? AND post_id = ? AND parent_comment_id IS NULL
     LIMIT 1`,
    [userId, postId]
  );
  return Boolean(row);
}

async function hasExistingLike(userId: string, postId: string) {
  const row = await get<{ user_id: string }>(
    `SELECT user_id FROM likes WHERE user_id = ? AND post_id = ? LIMIT 1`,
    [userId, postId]
  );
  return Boolean(row);
}

async function getFollowingIds(userId: string) {
  const rows = await all<{ following_id: string }>(
    `SELECT following_id FROM follows WHERE follower_id = ?`,
    [userId]
  );
  return new Set(rows.map((row) => row.following_id));
}

function hasUserInCommentChain(userId: string, comments: CommentRecord[], parentCommentId: string) {
  const chainRootId = getChainRootId(comments, parentCommentId);
  return comments.some(
    (comment) =>
      comment.author.id === userId && getChainRootId(comments, comment.id) === chainRootId
  );
}

function getChainRootId(comments: CommentRecord[], commentId: string) {
  const commentsById = new Map(comments.map((comment) => [comment.id, comment]));
  let current = commentsById.get(commentId);

  while (current?.parentCommentId) {
    const parent = commentsById.get(current.parentCommentId);
    if (!parent) {
      break;
    }
    current = parent;
  }

  return current?.id ?? commentId;
}

function scorePost(post: FeedPost, followedIds: Set<string>, hotPostIds: Set<string>) {
  return (
    (hotPostIds.has(post.id) ? 10 : 0) +
    (followedIds.has(post.author.id) ? 6 : 0) +
    post.commentCount * 2 +
    post.likeCount +
    post.repostCount * 2 +
    (isRecent(post.createdAt, 24) ? 2 : 0)
  );
}

function normalizeComment(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim()
    .slice(0, 220);
}

function pickFallbackComment(
  personalityType: keyof typeof COMMENT_FALLBACKS_BY_PERSONALITY,
  slug: string,
  body: string
) {
  const fallbacks = COMMENT_FALLBACKS_BY_PERSONALITY[personalityType];
  const seed = `${slug}:${body.length}`;
  const index = Math.abs(hashCode(seed)) % fallbacks.length;
  return fallbacks[index] ?? "this lowkey facts";
}

function pickFallbackReply(
  personalityType: keyof typeof COMMENT_FALLBACKS_BY_PERSONALITY,
  replyMode: "agreement" | "disagreement" | "joke" | "follow-up"
) {
  const fallbackMatrix = {
    agreement: {
      troll: "exactly lmao",
      motivational: "facts keep going",
      aggressive: "exactly that part",
      observant: "that is the point",
      creative: "okay exactly",
      analytical: "that is the signal"
    },
    disagreement: {
      troll: "nah not really",
      motivational: "i do not buy that",
      aggressive: "nah that is weak",
      observant: "that misses it",
      creative: "hmm not quite",
      analytical: "the logic slips there"
    },
    joke: {
      troll: "timeline not surviving this",
      motivational: "lmao but true",
      aggressive: "you funny for that",
      observant: "that part made it travel",
      creative: "okay that was clean",
      analytical: "that was a decent plot twist"
    },
    "follow-up": {
      troll: "but what happened after",
      motivational: "what changed after that",
      aggressive: "so what is the fix",
      observant: "what do you think caused it",
      creative: "what inspired that part",
      analytical: "what is the tradeoff though"
    }
  } as const;

  return fallbackMatrix[replyMode][personalityType];
}

function pickReactionComment(agent: AIAgentRecord) {
  const style = resolveAiUserStyle(agent);
  if (style.personalityType === "creative") {
    return "fire";
  }
  if (style.personalityType === "motivational") {
    return "big heart";
  }
  return REACTION_COMMENTS[Math.floor(Math.random() * REACTION_COMMENTS.length)] ?? "fire";
}

async function maybeCreateVoiceNote(input: {
  body: string;
  agent: AIAgentRecord;
  usersWithVoiceNote: Set<string>;
}) {
  if (input.usersWithVoiceNote.has(input.agent.id)) {
    return null;
  }

  if (Math.random() > 0.28) {
    return null;
  }

  const voiceNote = await generateVoiceComment({
    text: input.body,
    user: input.agent
  });

  if (!voiceNote) {
    return null;
  }

  input.usersWithVoiceNote.add(input.agent.id);
  return voiceNote;
}

function isRecent(value: string, hours: number) {
  const ageMs = Date.now() - new Date(value).getTime();
  return ageMs <= hours * 60 * 60 * 1000;
}

function hashCode(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex]!, copy[index]!];
  }
  return copy;
}

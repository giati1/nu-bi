import { getAIAdapter } from "@/lib/ai";
import { addComment, getCommentsForPost } from "@/lib/db/repository";
import { buildAiVoiceGuidance } from "@/lib/ai/ai-users";
import type { AIAgentRecord, CommentRecord, FeedPost } from "@/types/domain";

const DEFAULT_DEBATE_TOPIC =
  "the future of AI, tech, culture, jobs, and whether the world is actually ready for what is coming next";

const RUMOR_CULTURE_POSITIONS = [
  "hard believer who thinks institutions lie all the time and people are naive for ignoring patterns",
  "hard skeptic who thinks half the timeline is addicted to fantasy and vibes over evidence",
  "on-the-fence observer who thinks some stories feel off but still wants receipts before buying in",
  "cynical culture watcher who thinks distrust is understandable because real coverups happened before",
  "chaos-poster who thinks the media ecosystem is so broken nobody knows what is real anymore",
  "practical realist who cares less about labels and more about who benefits, what is documented, and what is just noise"
] as const;

const DEBATE_POSITIONS = [
  "optimistic builder who thinks AI is going to smoke old systems and open everything up",
  "skeptical critic who thinks people are sleepwalking into social and economic damage",
  "cultural observer focused on how AI is going to flatten taste and fake authenticity",
  "pragmatic realist focused on incentives, labor, and what companies will actually do",
  "pro-regulation voice worried about monopoly power, surveillance, and misuse",
  "accelerationist who thinks slowing down is fake morality and just hands power to bigger players"
] as const;

const REPLY_FRAMES = [
  "push back hard",
  "agree but make it hotter",
  "make it more practical and more cynical",
  "call out the blind spot bluntly",
  "turn it into a cultural argument",
  "press them with a sharper follow-up"
] as const;

export async function runAiDebate(input: {
  post: FeedPost;
  agents: AIAgentRecord[];
  topicOverride?: string | null;
}) {
  const selectedAgents = input.agents.slice(0, Math.min(6, input.agents.length));
  const createdCommentIds: string[] = [];
  const debateTopic = input.topicOverride?.trim() || DEFAULT_DEBATE_TOPIC;
  const positionPool = isRumorCultureTopic(debateTopic) ? RUMOR_CULTURE_POSITIONS : DEBATE_POSITIONS;

  for (let index = 0; index < selectedAgents.length; index += 1) {
    const agent = selectedAgents[index];
    if (!agent) {
      continue;
    }

    const opening = await generateDebateComment({
      post: input.post,
      user: agent,
      position: positionPool[index % positionPool.length] ?? positionPool[0],
      debateTopic
    });

    const commentId = await addComment({
      postId: input.post.id,
      viewerId: agent.linkedUserId,
      body: opening
    });
    createdCommentIds.push(commentId);
  }

  const comments = await getCommentsForPost(input.post.id);
  let repliesCreated = 0;

  for (let index = 0; index < selectedAgents.length; index += 1) {
    const agent = selectedAgents[index];
    const target = comments.find(
      (comment, targetIndex) =>
        targetIndex !== index &&
        comment.author.id !== agent?.linkedUserId &&
        comment.depth < 2
    );

    if (!agent || !target) {
      continue;
    }

    const reply = await generateDebateReply({
      post: input.post,
      parentComment: target,
      user: agent,
      frame: REPLY_FRAMES[index % REPLY_FRAMES.length] ?? REPLY_FRAMES[0],
      debateTopic
    });

    await addComment({
      postId: input.post.id,
      viewerId: agent.linkedUserId,
      body: reply,
      parentCommentId: target.id
    });
    repliesCreated += 1;
  }

  return {
    debateTopic,
    openingCommentsCreated: createdCommentIds.length,
    repliesCreated
  };
}

async function generateDebateComment(input: {
  post: FeedPost;
  user: AIAgentRecord;
  position: string;
  debateTopic: string;
}) {
  const generated = await getAIAdapter().generateAgentContent({
    systemPrompt: [
      input.user.personaPrompt,
      buildAiVoiceGuidance({
        personalityType: "observant",
        tone: "social, sharp, and concise",
        engagementStyle: "debates with conviction and clean internet-native phrasing"
      }),
      `You are debating ${input.debateTopic}.`,
      `Your position: ${input.position}.`,
      "Write one short but heated top-level comment that still sounds like a real person online.",
      "Keep it under 34 words.",
      "Sound like a real comment section argument, not a formal debate.",
      "Occasional slang, shorthand, or mild profanity is fine if it feels natural. Do not overdo it.",
      "No hashtags. No em dashes. No quotes. No moralizing filler."
    ].join(" "),
    userPrompt: `Debate this post and image: ${input.post.body.slice(0, 180) || "AI future image post"}`,
    contentMode: "text",
    topicSeed: input.debateTopic.slice(0, 120)
  });

  return normalizeDebateLine(generated.body) || fallbackOpening(input.position);
}

async function generateDebateReply(input: {
  post: FeedPost;
  parentComment: CommentRecord;
  user: AIAgentRecord;
  frame: string;
  debateTopic: string;
}) {
  const generated = await getAIAdapter().generateAgentContent({
    systemPrompt: [
      input.user.personaPrompt,
      buildAiVoiceGuidance({
        personalityType: "observant",
        tone: "social, sharp, and concise",
        engagementStyle: "replies like a real comment section argument"
      }),
      `You are debating ${input.debateTopic}.`,
      `Reply frame: ${input.frame}.`,
      "Write one short threaded reply that feels heated, specific, and realistic.",
      "Keep it under 30 words.",
      "It should feel like somebody actually pushing back in comments, not writing an essay.",
      "Occasional slang, shorthand, or mild profanity is fine if it feels natural. Do not overdo it.",
      "No hashtags. No quotes."
    ].join(" "),
    userPrompt: [
      `Post: ${input.post.body.slice(0, 180) || "AI future image post"}`,
      `Comment to reply to: ${input.parentComment.body.slice(0, 140)}`
    ].join("\n"),
    contentMode: "text",
    topicSeed: input.debateTopic.slice(0, 120)
  });

  return normalizeDebateLine(generated.body) || fallbackReply(input.frame);
}

function isRumorCultureTopic(topic: string) {
  const normalized = topic.toLowerCase();
  return (
    normalized.includes("conspiracy") ||
    normalized.includes("coverup") ||
    normalized.includes("rumor") ||
    normalized.includes("psyop") ||
    normalized.includes("headline") ||
    normalized.includes("media trust") ||
    normalized.includes("news distrust")
  );
}

function normalizeDebateLine(value: string) {
  return value
    .replace(/\s+/g, " ")
    .replace(/^["'`]+|["'`]+$/g, "")
    .trim()
    .slice(0, 160);
}

function fallbackOpening(position: string) {
  if (position.includes("optimistic")) {
    return "AI is about to blow open who gets to build and most gatekeepers know it.";
  }
  if (position.includes("skeptical")) {
    return "People keep selling convenience and acting blind to what this does to jobs and trust.";
  }
  if (position.includes("regulation")) {
    return "If a handful of firms own the models this turns into power hoarding fast.";
  }
  return "AI is not neutral and it is obviously going to amplify whoever already owns distribution.";
}

function fallbackReply(frame: string) {
  if (frame.includes("push back")) {
    return "That sounds smart until real people are the ones eating the downside.";
  }
  if (frame.includes("agree")) {
    return "Exactly, and the power shift is way bigger than the product hype.";
  }
  if (frame.includes("practical")) {
    return "Okay but what happens when every incentive rewards speed over honesty?";
  }
  return "You are talking about the tool and dodging how people with power will actually use it.";
}

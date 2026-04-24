import type { NotificationRecord } from "@/types/domain";

export function getNotificationHref(notification: Pick<NotificationRecord, "actor" | "entityId" | "entityType">) {
  if (notification.entityType === "story" && notification.entityId) {
    return "/home";
  }
  if (notification.entityType === "post" && notification.entityId) {
    return `/post/${notification.entityId}`;
  }
  if (notification.entityType === "conversation" && notification.entityId) {
    return `/messages/${notification.entityId}`;
  }
  if (notification.actor) {
    return `/profile/${notification.actor.username}`;
  }
  return "/notifications";
}

export function getNotificationTitle(notification: Pick<NotificationRecord, "actor" | "type">) {
  const actorName = notification.actor?.displayName ?? "NU-BI";

  switch (notification.type) {
    case "message":
      return `${actorName} sent you a message`;
    case "like":
      return `${actorName} liked your post`;
    case "comment":
      return `${actorName} commented on your post`;
    case "mention":
      return `${actorName} mentioned you in a post`;
    case "repost":
      return `${actorName} reposted your post`;
    case "story_reaction":
      return `${actorName} reacted to your story`;
    case "story_reply":
      return `${actorName} replied to your story`;
    case "follow":
      return `${actorName} followed you`;
    default:
      return `${actorName} triggered a ${notification.type} notification`;
  }
}

export function getNotificationDetail(notification: Pick<NotificationRecord, "type">) {
  switch (notification.type) {
    case "message":
      return "Open the conversation to reply.";
    case "like":
      return "Jump back into the post and keep momentum going.";
    case "comment":
      return "Open the thread and answer while it is fresh.";
    case "mention":
      return "Open the post and join the conversation.";
    case "repost":
      return "Your post is moving. Jump back in and keep it going.";
    case "story_reaction":
      return "Your story picked up a reaction.";
    case "story_reply":
      return "Open stories to read the reply and keep it moving.";
    case "follow":
      return "View the profile and decide whether to follow back.";
    default:
      return "Open the alert to see the latest activity.";
  }
}

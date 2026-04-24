import { z } from "zod";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters.")
  .max(24, "Username must be 24 characters or fewer.")
  .refine((value) => !value.includes("/"), "Username cannot include a slash.");

export const signupSchema = z.object({
  email: z.string().email(),
  username: usernameSchema,
  displayName: z.string().min(2).max(50),
  password: z.string().min(8).max(100)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100)
});

export const postSchema = z
  .object({
    body: z.string().max(500).optional().default(""),
    contentType: z.enum(["standard", "poll"]).optional().default("standard"),
    status: z.enum(["published", "draft", "scheduled"]).optional().default("published"),
    scheduledFor: z.string().optional().nullable(),
    repostOfPostId: z.string().uuid().optional().nullable(),
    media: z
      .array(
        z.object({
          storageKey: z.string(),
          url: z.string(),
          mimeType: z.string().nullable()
        })
      )
      .max(4)
      .optional()
      .default([]),
    pollOptions: z.array(z.string().max(80)).max(4).optional().default([])
  })
  .superRefine((value, ctx) => {
    if (!value.body.trim() && value.media.length === 0 && !value.repostOfPostId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add some text or at least one image before posting."
      });
    }
    if (value.contentType === "poll" && value.pollOptions.filter((item) => item.trim()).length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Poll posts need at least two options."
      });
    }
    if (value.status === "scheduled" && !value.scheduledFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheduled posts need a publish time."
      });
    }
  });

export const storySchema = z
  .object({
    body: z.string().max(280).optional().default(""),
    media: z
      .array(
        z.object({
          storageKey: z.string(),
          url: z.string(),
          mimeType: z.string().nullable()
        })
      )
      .max(1)
      .optional()
      .default([]),
    destinationPath: z.string().max(200).optional().nullable(),
    destinationLabel: z.string().max(40).optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (!value.body.trim() && value.media.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Add a story caption or media."
      });
    }
  });

export const storySeenSchema = z.object({
  storyId: z.string().uuid()
});

export const storyEngagementSchema = z
  .object({
    storyId: z.string().uuid(),
    kind: z.enum(["reaction", "reply"]),
    emoji: z.string().min(1).max(16).optional().nullable(),
    body: z.string().max(240).optional().nullable(),
    media: z
      .array(
        z.object({
          storageKey: z.string(),
          url: z.string(),
          mimeType: z.string().nullable()
        })
      )
      .max(1)
      .optional()
      .default([])
  })
  .superRefine((value, ctx) => {
    if (value.kind === "reaction" && !value.emoji?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Pick a reaction."
      });
    }
    if (value.kind === "reply" && !value.body?.trim() && value.media.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Write a reply or attach a voice note."
      });
    }
  });

export const commentSchema = z.object({
  postId: z.string().uuid(),
  body: z.string().max(280).optional().default(""),
  media: z
    .array(
      z.object({
        storageKey: z.string(),
        url: z.string(),
        mimeType: z.string().nullable()
      })
    )
    .max(1)
    .optional()
    .default([])
}).superRefine((value, ctx) => {
  if (!value.body.trim() && value.media.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add a comment or voice note."
    });
  }
});

export const followSchema = z.object({
  targetUserId: z.string().uuid()
});

export const likeSchema = z.object({
  postId: z.string().uuid()
});

export const repostSchema = z.object({
  postId: z.string().uuid()
});

export const messageSchema = z.object({
  conversationId: z.string().uuid().optional(),
  recipientId: z.string().uuid().optional(),
  body: z.string().max(1000).optional().default(""),
  replyToMessageId: z.string().uuid().optional().nullable(),
  media: z
    .array(
      z.object({
        storageKey: z.string(),
        url: z.string(),
        mimeType: z.string().nullable()
      })
    )
    .max(4)
    .optional()
    .default([])
}).superRefine((value, ctx) => {
  if (!value.body.trim() && value.media.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Add a message or an attachment."
    });
  }
});

export const profileUpdateSchema = z.object({
  username: usernameSchema,
  displayName: z.string().min(2).max(50),
  bio: z.string().max(240),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  location: z.string().max(80).optional().or(z.literal("")).nullable(),
  avatarUrl: z.string().optional().or(z.literal("")).nullable(),
  voiceIntroUrl: z.string().optional().or(z.literal("")).nullable(),
  voiceIntroMimeType: z.string().optional().or(z.literal("")).nullable(),
  isPrivate: z.boolean().optional().default(false)
});

export const postUpdateSchema = z
  .object({
    body: z.string().max(500),
    status: z.enum(["published", "draft", "scheduled"]).default("published"),
    scheduledFor: z.string().optional().nullable()
  })
  .superRefine((value, ctx) => {
    if (value.status === "scheduled" && !value.scheduledFor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Scheduled posts need a publish time."
      });
    }
  });

export const reportSchema = z.object({
  targetUserId: z.string().uuid().optional().nullable(),
  targetPostId: z.string().uuid().optional().nullable(),
  reason: z.string().min(2).max(80),
  details: z.string().max(280).optional().nullable()
});

export const savePostSchema = z.object({
  postId: z.string().uuid()
});

export const votePollSchema = z.object({
  optionId: z.string().uuid()
});

export const messageReactionSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().min(1).max(8)
});

export const conversationStateSchema = z.object({
  conversationId: z.string().uuid(),
  isPinned: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  isMuted: z.boolean().optional()
});

export const notificationPreferencesSchema = z.object({
  likesEnabled: z.boolean(),
  commentsEnabled: z.boolean(),
  followsEnabled: z.boolean(),
  messagesEnabled: z.boolean(),
  quietHoursStart: z.number().int().min(0).max(23).nullable(),
  quietHoursEnd: z.number().int().min(0).max(23).nullable()
});

export const interestSchema = z.object({
  interest: z.string().min(2).max(40),
  enabled: z.boolean()
});

export const relationshipSchema = z.object({
  targetUserId: z.string().uuid()
});

export const pinPostSchema = z.object({
  postId: z.string().uuid().nullable()
});

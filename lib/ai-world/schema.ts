import { z } from "zod";

const short = z.string().max(160);
const dated = z.string().datetime();
export const publicWorldSchema = z.object({
  publishedAt: dated,
  agents: z.array(z.object({ id: short, name: short, role: z.string().max(1200), provider: short, model: short, enabled: z.boolean() })).max(20),
  projects: z.array(z.object({ id: short, title: short, goal: z.string().max(4000), status: z.enum(["open", "completed"]), createdAt: dated, codingProgress: z.object({runtime:z.enum(["node","python"]),revision:z.number().int().nonnegative(),testsPassed:z.boolean(),readyForReview:z.boolean()}).optional() })).max(20),
  messages: z.array(z.object({ id: short, projectId: short, author: short, body: z.string().max(12000), model: short.optional(), provider: short.optional(), createdAt: dated })).max(100),
  artifacts: z.array(z.object({ id: short, projectId: short, author: short, title: short, content: z.string().max(24000), status: z.literal("draft"), createdAt: dated })).max(20),
  activity: z.object({ status: short, currentAgent: short.nullable(), turns: z.number().int().min(0).max(24), maxTurns: z.number().int().min(0).max(24) }).nullable(),
});
export type PublicWorld = z.infer<typeof publicWorldSchema>;

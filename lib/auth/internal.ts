import { notFound } from "next/navigation";
import { requirePageViewer, requireViewer } from "@/lib/auth/session";
import { env } from "@/lib/config/env";

export function isInternalAdminUsername(username: string) {
  return env.aiAgentAdminUsernames.includes(username.trim().toLowerCase());
}

export async function requireInternalAdminViewer() {
  const viewer = await requireViewer();
  if (!isInternalAdminUsername(viewer.username)) {
    throw new Error("FORBIDDEN");
  }
  return viewer;
}

export async function requireInternalAdminPage(nextPath: string) {
  const viewer = await requirePageViewer(nextPath);
  if (!isInternalAdminUsername(viewer.username)) {
    notFound();
  }
  return viewer;
}

export function assertSchedulerSecret(request: Request) {
  if (!env.aiAgentSchedulerSecret) {
    throw new Error("AI agent scheduler secret is not configured.");
  }

  const header = request.headers.get("x-ai-agent-secret")?.trim() ?? "";
  if (!header || header !== env.aiAgentSchedulerSecret) {
    throw new Error("FORBIDDEN");
  }
}

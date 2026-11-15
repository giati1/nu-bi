import { NextResponse } from "next/server";
import { assertLocalAgentSecret } from "@/lib/auth/internal";
import { getRequestOrigin } from "@/lib/auth/redirect";
import { env } from "@/lib/config/env";

export async function GET(request: Request) {
  try {
    assertLocalAgentSecret(request);
    return NextResponse.json({
      requestOrigin: getRequestOrigin(request)?.toString() ?? null,
      appUrl: env.appUrl,
      googleRedirectUri: env.googleRedirectUri,
      hasGoogleClientId: Boolean(env.googleClientId),
      hasGoogleClientSecret: Boolean(env.googleClientSecret),
      hasGoogleRedirectUri: Boolean(env.googleRedirectUri),
      cloudflareEnv: env.cloudflareEnv
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

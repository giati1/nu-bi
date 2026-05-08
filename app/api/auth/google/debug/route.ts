import { NextResponse } from "next/server";
import { getRequestOrigin } from "@/lib/auth/redirect";
import { env } from "@/lib/config/env";

export async function GET(request: Request) {
  return NextResponse.json({
    requestOrigin: getRequestOrigin(request)?.toString() ?? null,
    appUrl: env.appUrl,
    googleRedirectUri: env.googleRedirectUri,
    hasGoogleClientId: Boolean(env.googleClientId),
    hasGoogleClientSecret: Boolean(env.googleClientSecret),
    hasGoogleRedirectUri: Boolean(env.googleRedirectUri),
    cloudflareEnv: env.cloudflareEnv
  });
}

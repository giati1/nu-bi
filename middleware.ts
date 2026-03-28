import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/home",
  "/messages",
  "/notifications",
  "/saved",
  "/explore",
  "/shorts",
  "/creator",
  "/ai",
  "/settings",
  "/api/posts",
  "/api/comments",
  "/api/likes",
  "/api/follow",
  "/api/messages",
  "/api/profile",
  "/api/saved",
  "/api/polls",
  "/api/conversations",
  "/api/interests",
  "/api/notifications",
  "/api/reports",
  "/api/shorts",
  "/api/settings",
  "/api/upload",
  "/api/ai"
];

export function middleware(request: NextRequest) {
  const session = request.cookies.get(
    process.env.SESSION_COOKIE_NAME ?? "nubi_session"
  )?.value;

  const protectedPath = protectedPrefixes.some((prefix) =>
    request.nextUrl.pathname.startsWith(prefix)
  );

  if (protectedPath && !session) {
    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|uploads).*)"]
};

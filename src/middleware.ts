import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE, authEnabled, expectedToken, safeEqual } from "@/lib/auth";

// Public asset paths that must load before the user can authenticate.
const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/manifest.webmanifest",
  "/sw.js",
  "/robots.txt",
]);

function isPublic(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname.startsWith("/api/login") ||
    PUBLIC_FILES.has(pathname)
  );
}

export async function middleware(req: NextRequest) {
  // Open demo when no password is configured.
  if (!authEnabled()) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (isPublic(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(AUTH_COOKIE)?.value ?? "";
  const expected = await expectedToken();
  if (cookie && safeEqual(cookie, expected)) return NextResponse.next();

  // Unauthenticated: APIs get 401 JSON, pages redirect to the login screen.
  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("from", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  // Run on everything except Next internals (static/image are already public).
  matcher: ["/((?!_next/static|_next/image).*)"],
};

import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { isInstagramEnabled, instagramRedirectUri, buildAuthUrl } from "@/lib/instagram";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Kicks off Instagram's official OAuth. Generates a CSRF `state`, stashes it in
// an httpOnly cookie, and 302-redirects to the Instagram authorize dialog.
export async function GET(req: Request) {
  const blocked = await enforce(req, { name: "ig-connect", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  if (!isInstagramEnabled()) {
    return NextResponse.json(
      {
        error: "not_configured",
        message:
          "Instagram is not configured. Set INSTAGRAM_APP_ID and INSTAGRAM_APP_SECRET (create a Meta app first).",
      },
      { status: 503 },
    );
  }

  const origin = new URL(req.url).origin;
  const redirectUri = instagramRedirectUri(origin);
  const state = randomBytes(16).toString("hex");
  const res = NextResponse.redirect(buildAuthUrl(state, redirectUri));
  // CSRF guard: the callback must echo this exact state back.
  res.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return res;
}

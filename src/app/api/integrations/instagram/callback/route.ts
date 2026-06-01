import { NextResponse } from "next/server";
import {
  isInstagramEnabled,
  instagramRedirectUri,
  exchangeCodeForToken,
  getLongLivedToken,
  fetchProfile,
  storeInstagramConnection,
} from "@/lib/instagram";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// OAuth callback. Verifies the CSRF state, exchanges the code for a long-lived
// token, fetches the profile, and stores the connection server-side. Always
// redirects back to /integrations with an ?ig= status — never leaks details.
export async function GET(req: Request) {
  const blocked = await enforce(req, { name: "ig-callback", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;

  const url = new URL(req.url);
  const origin = url.origin;
  const back = (status: string) =>
    NextResponse.redirect(`${origin}/integrations?ig=${status}`);

  if (!isInstagramEnabled()) return back("not_configured");
  if (url.searchParams.get("error")) return back("denied");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieState = req.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)ig_oauth_state=([a-f0-9]+)/)?.[1];

  // CSRF: state must be present and match the cookie set at connect time.
  if (!code || !state || !cookieState || state !== cookieState) {
    return back("state_mismatch");
  }

  try {
    const redirectUri = instagramRedirectUri(origin);
    const short = await exchangeCodeForToken(code, redirectUri);
    const long = await getLongLivedToken(short.accessToken);
    const profile = await fetchProfile(long.accessToken);
    await storeInstagramConnection(long.accessToken, profile, long.expiresIn);
    const res = back("connected");
    res.cookies.set("ig_oauth_state", "", { path: "/", maxAge: 0 });
    return res;
  } catch (e) {
    console.error("[ig] callback failed:", e);
    return back("error");
  }
}

// Official Instagram Graph API client (Instagram Business Login flow).
//
// ToS-compliant by construction: the user authorizes their OWN Business/Creator
// account through Instagram's official OAuth dialog. No password handling, no
// scraping, no unofficial endpoints. Entirely DORMANT until INSTAGRAM_APP_ID +
// INSTAGRAM_APP_SECRET are set — shipping it changes nothing until the user
// creates a Meta app. Access tokens are stored server-side only (on the user's
// own Instagram integration row) and are never returned to the browser.
//
// Setup (the user does this once, in their own Meta Developer account — gated):
//   1. Create an app at https://developers.facebook.com → add the
//      "Instagram" product (Instagram API with Instagram Login).
//   2. Set the OAuth redirect URI to:  {origin}/api/integrations/instagram/callback
//   3. Convert the Instagram account to Business or Creator.
//   4. Set env: INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET
//      (optional INSTAGRAM_REDIRECT_URI to override the derived callback).

import { prisma, getDemoUser } from "./prisma";
import { parseJson } from "./utils";

// Fixed Meta hosts only — no user-controlled host ever reaches fetch (SSRF-safe).
const GRAPH = "https://graph.instagram.com";
const AUTHORIZE = "https://www.instagram.com/oauth/authorize";
const TOKEN_EXCHANGE = "https://api.instagram.com/oauth/access_token";
// Minimal scope: read the user's own profile + media. No write/insights scope.
const SCOPE = "instagram_business_basic";

export function isInstagramEnabled(): boolean {
  return Boolean(process.env.INSTAGRAM_APP_ID && process.env.INSTAGRAM_APP_SECRET);
}

export function instagramRedirectUri(origin: string): string {
  return process.env.INSTAGRAM_REDIRECT_URI || `${origin}/api/integrations/instagram/callback`;
}

export function buildAuthUrl(state: string, redirectUri: string): string {
  const p = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPE,
    state,
  });
  return `${AUTHORIZE}?${p.toString()}`;
}

export interface IgShortToken {
  accessToken: string;
  userId: string;
}

export async function exchangeCodeForToken(
  code: string,
  redirectUri: string,
): Promise<IgShortToken> {
  const body = new URLSearchParams({
    client_id: process.env.INSTAGRAM_APP_ID!,
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(TOKEN_EXCHANGE, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error("ig_token_exchange_failed");
  const j = await res.json();
  if (!j?.access_token) throw new Error("ig_token_exchange_failed");
  return { accessToken: String(j.access_token), userId: String(j.user_id ?? "") };
}

export async function getLongLivedToken(
  shortToken: string,
): Promise<{ accessToken: string; expiresIn: number }> {
  const p = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: process.env.INSTAGRAM_APP_SECRET!,
    access_token: shortToken,
  });
  const res = await fetch(`${GRAPH}/access_token?${p.toString()}`);
  if (!res.ok) throw new Error("ig_longlived_failed");
  const j = await res.json();
  if (!j?.access_token) throw new Error("ig_longlived_failed");
  return { accessToken: String(j.access_token), expiresIn: Number(j.expires_in ?? 0) };
}

export interface IgProfile {
  userId: string;
  username: string;
  accountType: string;
  mediaCount: number;
}

export async function fetchProfile(token: string): Promise<IgProfile> {
  const p = new URLSearchParams({
    fields: "user_id,username,account_type,media_count",
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/me?${p.toString()}`);
  if (!res.ok) throw new Error("ig_profile_failed");
  const j = await res.json();
  return {
    userId: String(j.user_id ?? ""),
    username: String(j.username ?? ""),
    accountType: String(j.account_type ?? ""),
    mediaCount: Number(j.media_count ?? 0),
  };
}

export interface IgMedia {
  id: string;
  caption: string;
  mediaType: string;
  permalink: string;
  timestamp: string;
  likeCount: number;
  commentsCount: number;
}

export async function fetchMedia(token: string, limit = 25): Promise<IgMedia[]> {
  const p = new URLSearchParams({
    fields: "id,caption,media_type,permalink,timestamp,like_count,comments_count",
    limit: String(Math.min(Math.max(limit, 1), 50)),
    access_token: token,
  });
  const res = await fetch(`${GRAPH}/me/media?${p.toString()}`);
  if (!res.ok) throw new Error("ig_media_failed");
  const j = await res.json();
  return (j?.data ?? []).map((m: any) => ({
    id: String(m.id ?? ""),
    caption: String(m.caption ?? ""),
    mediaType: String(m.media_type ?? ""),
    permalink: String(m.permalink ?? ""),
    timestamp: String(m.timestamp ?? ""),
    likeCount: Number(m.like_count ?? 0),
    commentsCount: Number(m.comments_count ?? 0),
  }));
}

// --- Connection storage: the access token lives only on the server, on the
// user's own Instagram integration row. It is never sent to the client. ---

export async function storeInstagramConnection(
  token: string,
  profile: IgProfile,
  expiresIn: number,
): Promise<void> {
  const user = await getDemoUser();
  const meta = {
    accessToken: token, // server-side only — never returned by any endpoint
    userId: profile.userId,
    username: profile.username,
    accountType: profile.accountType,
    mediaCount: profile.mediaCount,
    connectedAt: new Date().toISOString(),
    expiresInSec: expiresIn,
  };
  await prisma.integration.upsert({
    where: { userId_key: { userId: user.id, key: "instagram" } },
    update: { status: "connected", metadataJson: JSON.stringify(meta) },
    create: {
      userId: user.id,
      key: "instagram",
      name: "Instagram",
      description: "Official Instagram Graph API (Business/Creator)",
      status: "connected",
      metadataJson: JSON.stringify(meta),
    },
  });
}

export interface IgConnection {
  token: string;
  username: string;
  mediaCount: number;
}

/** Returns the stored connection (incl. server-side token) or null. */
export async function getInstagramConnection(): Promise<IgConnection | null> {
  const user = await getDemoUser();
  const row = await prisma.integration.findUnique({
    where: { userId_key: { userId: user.id, key: "instagram" } },
  });
  if (!row) return null;
  const meta = parseJson<Record<string, unknown>>(row.metadataJson, {});
  if (!meta.accessToken) return null;
  return {
    token: String(meta.accessToken),
    username: String(meta.username ?? ""),
    mediaCount: Number(meta.mediaCount ?? 0),
  };
}

export async function disconnectInstagram(): Promise<void> {
  const user = await getDemoUser();
  await prisma.integration.updateMany({
    where: { userId: user.id, key: "instagram" },
    data: { status: "available", metadataJson: "{}" },
  });
}

// Opt-in single-password gate. Enforced ONLY when APP_PASSWORD is set; when it
// is blank the app runs as an open demo (so the live deployment is never
// accidentally locked out). This module is edge-safe — it uses Web Crypto
// (global `crypto.subtle`) and no node-only imports, so both the middleware
// (edge runtime) and the login route (node runtime) can share it.

export const AUTH_COOKIE = "recallos_auth";
export const AUTH_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function authEnabled(): boolean {
  return !!process.env.APP_PASSWORD;
}

/**
 * Deterministic, non-reversible token derived from the configured password.
 * The raw password is never stored in the cookie; forging the token requires
 * knowing APP_PASSWORD (SHA-256 preimage resistance).
 */
export async function expectedToken(): Promise<string> {
  const secret = process.env.APP_PASSWORD ?? "";
  const data = new TextEncoder().encode(`recallos:auth:${secret}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Constant-time string comparison (avoids leaking length/position via timing). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  AUTH_COOKIE,
  AUTH_MAX_AGE,
  authEnabled,
  expectedToken,
  safeEqual,
} from "@/lib/auth";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";

const Schema = z.object({ password: z.string().min(1).max(200) });

export async function POST(req: Request) {
  // Throttle brute-force attempts hard.
  const blocked = await enforce(req, { name: "login", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;

  if (!authEnabled()) {
    // No password configured — nothing to log into.
    return NextResponse.json({ ok: true, note: "auth_disabled" });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  if (!safeEqual(parsed.data.password, process.env.APP_PASSWORD ?? "")) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  const token = await expectedToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "./prisma";

// ---------------------------------------------------------------------------
// Per-IP sliding-window limiter (in-memory, best-effort).
//
// On serverless the map lives per warm instance, so this is a soft guard
// against bursts hitting a single lambda — not a global guarantee. The
// DB-backed daily budget below is the hard ceiling on paid AI calls.
// ---------------------------------------------------------------------------

const hits = new Map<string, number[]>();
let lastSweep = Date.now();

function sweep(now: number) {
  // Drop expired buckets every minute so the map can't grow unbounded.
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, arr] of hits) {
    const fresh = arr.filter((t) => now - t < 600_000);
    if (fresh.length === 0) hits.delete(key);
    else hits.set(key, fresh);
  }
}

export function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim() || "unknown";
  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

export type RateResult = {
  ok: boolean;
  remaining: number;
  resetMs: number;
  limit: number;
};

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): RateResult {
  const now = Date.now();
  sweep(now);
  const { limit, windowMs } = opts;
  const arr = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= limit) {
    hits.set(key, arr);
    const resetMs = windowMs - (now - arr[0]);
    return { ok: false, remaining: 0, resetMs, limit };
  }
  arr.push(now);
  hits.set(key, arr);
  return { ok: true, remaining: limit - arr.length, resetMs: windowMs, limit };
}

// ---------------------------------------------------------------------------
// DB-backed daily AI budget.
//
// Counts today's AiProcessingLog rows for the user against an env ceiling.
// Caps spend on paid providers even across serverless instances.
// ---------------------------------------------------------------------------

const DEFAULT_DAILY_BUDGET = 200;

export function dailyBudget(): number {
  const raw = Number(process.env.RECALLOS_DAILY_AI_BUDGET);
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : DEFAULT_DAILY_BUDGET;
}

export async function aiBudget(): Promise<{
  used: number;
  limit: number;
  remaining: number;
}> {
  const limit = dailyBudget();
  try {
    const user = await getDemoUser();
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const used = await prisma.aiProcessingLog.count({
      where: { userId: user.id, createdAt: { gte: start } },
    });
    return { used, limit, remaining: Math.max(0, limit - used) };
  } catch {
    // If the budget can't be read, fail open rather than blocking the app.
    return { used: 0, limit, remaining: limit };
  }
}

// ---------------------------------------------------------------------------
// 429 helper + one-call guard used by API routes.
// ---------------------------------------------------------------------------

export function tooMany(message: string, resetMs?: number) {
  const res = NextResponse.json({ error: "rate_limited", message }, { status: 429 });
  if (resetMs && resetMs > 0) {
    res.headers.set("Retry-After", String(Math.ceil(resetMs / 1000)));
  }
  return res;
}

/**
 * Enforce per-IP rate limiting and (optionally) the daily AI budget.
 * Returns a 429 NextResponse when blocked, or null when the request may proceed.
 */
export async function enforce(
  req: Request,
  opts: { name: string; limit: number; windowMs: number; ai?: boolean },
): Promise<NextResponse | null> {
  const rl = rateLimit(`${opts.name}:${clientIp(req)}`, {
    limit: opts.limit,
    windowMs: opts.windowMs,
  });
  if (!rl.ok) {
    return tooMany(
      `Too many requests. Try again in ${Math.ceil(rl.resetMs / 1000)}s.`,
      rl.resetMs,
    );
  }
  if (opts.ai) {
    const budget = await aiBudget();
    if (budget.remaining <= 0) {
      return tooMany(
        `Daily AI budget reached (${budget.used}/${budget.limit}). It resets at midnight.`,
      );
    }
  }
  return null;
}

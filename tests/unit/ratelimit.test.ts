import { describe, it, expect } from "vitest";
import { clientIp, rateLimit, dailyBudget, tooMany } from "@/lib/ratelimit";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://musemint.test/api", { headers });
}

describe("rate limiting", () => {
  it("clientIp uses the right-most (trusted) x-forwarded-for hop, not the spoofable left-most", () => {
    // The left-most XFF value is client-supplied and forgeable; the right-most
    // is the one added closest to our server. Keying on the right-most prevents
    // an attacker from minting a fresh limiter bucket per request.
    expect(clientIp(reqWith({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("5.6.7.8");
  });

  it("clientIp prefers platform headers x-real-ip -> cf-connecting-ip over forgeable XFF", () => {
    // A trustworthy platform header wins even when an attacker also sends XFF.
    expect(
      clientIp(reqWith({ "x-real-ip": "9.9.9.9", "x-forwarded-for": "1.2.3.4" })),
    ).toBe("9.9.9.9");
    expect(clientIp(reqWith({ "cf-connecting-ip": "8.8.8.8" }))).toBe("8.8.8.8");
    expect(clientIp(reqWith({}))).toBe("unknown");
  });

  it("rateLimit allows up to the limit, then blocks within the window", () => {
    const key = `test-${Math.random()}`;
    const opts = { limit: 3, windowMs: 60_000 };
    expect(rateLimit(key, opts).ok).toBe(true);
    expect(rateLimit(key, opts).ok).toBe(true);
    const third = rateLimit(key, opts);
    expect(third.ok).toBe(true);
    expect(third.remaining).toBe(0);
    const fourth = rateLimit(key, opts);
    expect(fourth.ok).toBe(false);
    expect(fourth.resetMs).toBeGreaterThan(0);
  });

  it("rateLimit isolates distinct keys", () => {
    const a = `a-${Math.random()}`;
    const b = `b-${Math.random()}`;
    rateLimit(a, { limit: 1, windowMs: 60_000 });
    expect(rateLimit(a, { limit: 1, windowMs: 60_000 }).ok).toBe(false);
    expect(rateLimit(b, { limit: 1, windowMs: 60_000 }).ok).toBe(true);
  });

  it("dailyBudget honours a valid env override and defaults otherwise", () => {
    delete process.env.MUSEMINT_DAILY_AI_BUDGET;
    expect(dailyBudget()).toBe(200);
    process.env.MUSEMINT_DAILY_AI_BUDGET = "50";
    expect(dailyBudget()).toBe(50);
    process.env.MUSEMINT_DAILY_AI_BUDGET = "-5";
    expect(dailyBudget()).toBe(200);
    process.env.MUSEMINT_DAILY_AI_BUDGET = "abc";
    expect(dailyBudget()).toBe(200);
    delete process.env.MUSEMINT_DAILY_AI_BUDGET;
  });

  it("tooMany returns a 429 with a Retry-After header", () => {
    const res = tooMany("slow down", 5_000);
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("5");
  });
});

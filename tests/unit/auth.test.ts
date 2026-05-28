import { describe, it, expect, beforeEach } from "vitest";
import {
  authEnabled,
  expectedToken,
  safeEqual,
  AUTH_COOKIE,
  AUTH_MAX_AGE,
} from "@/lib/auth";

describe("auth gate", () => {
  beforeEach(() => {
    delete process.env.APP_PASSWORD;
  });

  it("authEnabled reflects APP_PASSWORD presence", () => {
    expect(authEnabled()).toBe(false);
    process.env.APP_PASSWORD = "hunter2";
    expect(authEnabled()).toBe(true);
    process.env.APP_PASSWORD = "";
    expect(authEnabled()).toBe(false);
  });

  it("expectedToken is a deterministic SHA-256 hex digest", async () => {
    process.env.APP_PASSWORD = "hunter2";
    const a = await expectedToken();
    const b = await expectedToken();
    expect(a).toBe(b);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });

  it("expectedToken differs for different passwords", async () => {
    process.env.APP_PASSWORD = "alpha";
    const a = await expectedToken();
    process.env.APP_PASSWORD = "beta";
    const b = await expectedToken();
    expect(a).not.toBe(b);
  });

  it("token never embeds the raw password (non-reversible)", async () => {
    process.env.APP_PASSWORD = "supersecret";
    const t = await expectedToken();
    expect(t).not.toContain("supersecret");
  });

  it("safeEqual: equal true, unequal false, length-mismatch false", () => {
    expect(safeEqual("abc", "abc")).toBe(true);
    expect(safeEqual("abc", "abd")).toBe(false);
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("", "")).toBe(true);
  });

  it("exposes stable cookie constants", () => {
    expect(AUTH_COOKIE).toBe("recallos_auth");
    expect(AUTH_MAX_AGE).toBeGreaterThan(0);
  });
});

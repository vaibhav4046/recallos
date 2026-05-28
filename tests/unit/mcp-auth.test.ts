import { describe, it, expect, beforeEach } from "vitest";
import { isAuthorized, mcpWriteEnabled, MCP_MAX_BATCH } from "@/lib/mcp";

describe("MCP auth gate", () => {
  beforeEach(() => {
    delete process.env.MCP_SECRET;
  });

  it("mcpWriteEnabled reflects MCP_SECRET presence", () => {
    expect(mcpWriteEnabled()).toBe(false);
    process.env.MCP_SECRET = "s3cr3t";
    expect(mcpWriteEnabled()).toBe(true);
  });

  it("isAuthorized is false when no secret is configured (writes off)", () => {
    expect(isAuthorized("Bearer anything")).toBe(false);
  });

  it("isAuthorized rejects missing or malformed headers", () => {
    process.env.MCP_SECRET = "s3cr3t";
    expect(isAuthorized(null)).toBe(false);
    expect(isAuthorized("")).toBe(false);
    expect(isAuthorized("s3cr3t")).toBe(false); // no Bearer prefix
    expect(isAuthorized("Basic s3cr3t")).toBe(false);
  });

  it("isAuthorized accepts the correct token (case-insensitive, trimmed)", () => {
    process.env.MCP_SECRET = "s3cr3t";
    expect(isAuthorized("Bearer s3cr3t")).toBe(true);
    expect(isAuthorized("bearer s3cr3t")).toBe(true);
    expect(isAuthorized("Bearer   s3cr3t  ")).toBe(true);
  });

  it("isAuthorized rejects incorrect tokens (value and length)", () => {
    process.env.MCP_SECRET = "s3cr3t";
    expect(isAuthorized("Bearer wrong")).toBe(false);
    expect(isAuthorized("Bearer s3cr3")).toBe(false);
  });

  it("MCP_MAX_BATCH is a sane positive cap", () => {
    expect(MCP_MAX_BATCH).toBeGreaterThan(0);
    expect(MCP_MAX_BATCH).toBeLessThanOrEqual(100);
  });
});

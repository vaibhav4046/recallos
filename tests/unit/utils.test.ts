import { describe, it, expect } from "vitest";
import { detectPlatform, slugify, truncate, parseJson, platformLabel } from "@/lib/utils";

describe("utils", () => {
  it("detectPlatform recognizes major hosts", () => {
    expect(detectPlatform("https://www.youtube.com/watch?v=x")).toBe("youtube");
    expect(detectPlatform("https://linkedin.com/posts/abc")).toBe("linkedin");
    expect(detectPlatform("https://github.com/foo/bar")).toBe("github");
    expect(detectPlatform("https://news.example.com")).toBe("web");
    expect(detectPlatform(undefined)).toBe("note");
  });

  it("slugify produces url-safe slugs", () => {
    expect(slugify("RecallOS · v1 design")).toBe("recallos-v1-design");
  });

  it("truncate respects max length", () => {
    expect(truncate("abcdef", 3)).toBe("ab…");
    expect(truncate("abc", 5)).toBe("abc");
  });

  it("parseJson returns fallback on bad input", () => {
    expect(parseJson<string[]>("nope", [])).toEqual([]);
    expect(parseJson<string[]>('["a"]', [])).toEqual(["a"]);
  });

  it("platformLabel maps known platforms", () => {
    expect(platformLabel("youtube")).toBe("YouTube");
    expect(platformLabel("custom")).toBe("custom");
  });
});

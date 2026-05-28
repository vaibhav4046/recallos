import { describe, it, expect, beforeEach } from "vitest";
import { extractVideoId, fetchYouTubeMetadata } from "@/lib/enrich/youtube";

describe("YouTube enrichment", () => {
  beforeEach(() => {
    delete process.env.YOUTUBE_API_KEY;
  });

  it("extracts video ID from a standard youtube.com URL", () => {
    expect(extractVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe(
      "dQw4w9WgXcQ",
    );
  });

  it("extracts video ID from a youtu.be short link", () => {
    expect(extractVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
  });

  it("extracts video ID from /shorts/", () => {
    expect(extractVideoId("https://www.youtube.com/shorts/abc123")).toBe("abc123");
  });

  it("extracts video ID from /embed/", () => {
    expect(extractVideoId("https://www.youtube.com/embed/xyz789")).toBe("xyz789");
  });

  it("returns null for non-YouTube URLs", () => {
    expect(extractVideoId("https://example.com/video")).toBeNull();
    expect(extractVideoId("not-a-url")).toBeNull();
  });

  it("fetchYouTubeMetadata returns null when YOUTUBE_API_KEY missing", async () => {
    const result = await fetchYouTubeMetadata(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    );
    expect(result).toBeNull();
  });

  it("fetchYouTubeMetadata returns null for non-YouTube URLs", async () => {
    process.env.YOUTUBE_API_KEY = "fake-key";
    const result = await fetchYouTubeMetadata("https://example.com/video");
    expect(result).toBeNull();
  });
});

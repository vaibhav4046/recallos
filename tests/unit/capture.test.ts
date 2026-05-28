import { describe, it, expect } from "vitest";
import { CaptureSchema } from "@/lib/capture";

describe("CaptureSchema", () => {
  it("accepts a youtube url capture", () => {
    const res = CaptureSchema.safeParse({
      kind: "youtube",
      url: "https://www.youtube.com/watch?v=abc",
      intent: "project",
    });
    expect(res.success).toBe(true);
  });

  it("rejects unknown kind", () => {
    const res = CaptureSchema.safeParse({ kind: "telegraph", title: "x" });
    expect(res.success).toBe(false);
  });

  it("accepts a note with rawContent only", () => {
    const res = CaptureSchema.safeParse({
      kind: "note",
      rawContent: "Build a job application agent",
    });
    expect(res.success).toBe(true);
  });

  it("rejects a note with no title and no body", () => {
    const res = CaptureSchema.safeParse({ kind: "note" });
    expect(res.success).toBe(false);
  });

  it("rejects a url capture with empty url, title, and content", () => {
    const res = CaptureSchema.safeParse({ kind: "url" });
    expect(res.success).toBe(false);
  });

  it("rejects a url capture where every field is just whitespace", () => {
    const res = CaptureSchema.safeParse({
      kind: "url",
      url: "",
      title: "   ",
      rawContent: "   ",
    });
    expect(res.success).toBe(false);
  });

  it("accepts a prompt with a title only", () => {
    const res = CaptureSchema.safeParse({
      kind: "prompt",
      title: "Saas landing prompt",
    });
    expect(res.success).toBe(true);
  });

  it("rejects a screenshot capture with no image, no notes, no title", () => {
    const res = CaptureSchema.safeParse({ kind: "screenshot" });
    expect(res.success).toBe(false);
  });

  it("accepts a screenshot capture with image data", () => {
    const res = CaptureSchema.safeParse({
      kind: "screenshot",
      imageData: "data:image/png;base64," + "A".repeat(200),
    });
    expect(res.success).toBe(true);
  });
});

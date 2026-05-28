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

  it("accepts a note without url", () => {
    const res = CaptureSchema.safeParse({
      kind: "note",
      rawContent: "Build a job application agent",
    });
    expect(res.success).toBe(true);
  });
});

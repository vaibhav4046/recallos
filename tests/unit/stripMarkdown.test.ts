import { describe, it, expect } from "vitest";
import { stripMarkdown } from "@/lib/utils";

describe("stripMarkdown", () => {
  it("removes **bold** markers", () => {
    expect(stripMarkdown("**AI Agents:** hot today")).toBe("AI Agents: hot today");
  });

  it("removes leading bullets and headers", () => {
    const input = "## Today\n- One\n- Two";
    expect(stripMarkdown(input)).toBe("Today\nOne\nTwo");
  });

  it("removes inline `code` ticks", () => {
    expect(stripMarkdown("Run `npm install` next")).toBe("Run npm install next");
  });

  it("collapses [link](url) to just the text", () => {
    expect(stripMarkdown("See [docs](https://example.com)")).toBe("See docs");
  });

  it("handles empty / undefined safely", () => {
    expect(stripMarkdown("")).toBe("");
  });
});

import { describe, it, expect } from "vitest";
import { generateBuildPack, packToChecklist, packToMarkdown } from "@/lib/ai/generateBuildPack";

describe("build pack generation", () => {
  it("falls back to deterministic content without API keys", async () => {
    delete process.env.OPENAI_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    const { pack } = await generateBuildPack({
      projectTitle: "Inbox classifier",
      whyItMatters: "Sharper triage",
      difficulty: "Intermediate",
      techStack: ["Next.js", "Prisma"],
      sourceItems: [
        { title: "MCP video", summary: "Build an agent" },
        { title: "RAG repo", summary: "Reference RAG impl" },
      ],
    });
    expect(pack.apiPlan.find((p) => p.path === "/api/capture")).toBeDefined();
    expect(pack.databaseSchema.find((d) => d.entity === "CapturedItem")).toBeDefined();
    expect(pack.tasks.length).toBeGreaterThanOrEqual(5);
  });

  it("packToMarkdown contains all sections", async () => {
    const { pack } = await generateBuildPack({
      projectTitle: "Demo",
      whyItMatters: "x",
      difficulty: "Beginner",
      techStack: [],
      sourceItems: [],
    });
    const md = packToMarkdown("Demo", pack);
    expect(md).toMatch(/# Demo/);
    expect(md).toMatch(/## API plan/);
    expect(md).toMatch(/## Resume bullets/);
  });

  it("packToChecklist produces github-style boxes", async () => {
    const { pack } = await generateBuildPack({
      projectTitle: "Demo",
      whyItMatters: "x",
      difficulty: "Beginner",
      techStack: [],
      sourceItems: [],
    });
    const cl = packToChecklist(pack);
    expect(cl).toMatch(/\- \[ \]/);
  });
});

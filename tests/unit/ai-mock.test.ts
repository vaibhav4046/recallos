import { describe, it, expect, beforeEach } from "vitest";
import { processItem } from "@/lib/ai/processItem";
import { generateBuildPack, packToChecklist, packToMarkdown } from "@/lib/ai/generateBuildPack";
import { improvePrompt } from "@/lib/ai/improvePrompt";
import { generateDigest } from "@/lib/ai/generateDigest";

beforeEach(() => {
  delete process.env.GOOGLE_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  delete process.env.GROQ_API_KEY;
});

describe("mock AI provider", () => {
  it("processItem returns scored result", async () => {
    const res = await processItem({
      title: "Build an AI Agent with MCP",
      url: "https://www.youtube.com/watch?v=foo",
      rawContent: "Walkthrough of MCP agents and tool use",
      kind: "youtube",
    });
    expect(res.category).toBe("AI Agents");
    expect(res.sourcePlatform).toBe("youtube");
    expect(res.scores.actionability).toBeGreaterThan(40);
    expect(res.nextAction.length).toBeGreaterThan(3);
  });

  it("generateBuildPack returns required sections", async () => {
    const { pack, provider } = await generateBuildPack({
      projectTitle: "RAG Notes",
      whyItMatters: "Synthesizes saved knowledge",
      difficulty: "Intermediate",
      techStack: ["Next.js"],
      sourceItems: [{ title: "Vector DB primer" }],
    });
    expect(provider).toBe("mock");
    expect(pack.userStories.length).toBeGreaterThan(0);
    expect(pack.tasks.length).toBeGreaterThan(0);
    expect(pack.readme).toContain("RAG Notes");
    expect(packToMarkdown("RAG Notes", pack)).toContain("# RAG Notes");
    expect(packToChecklist(pack)).toContain("- [ ]");
  });

  it("improvePrompt produces structured output", async () => {
    const res = await improvePrompt({
      title: "Resume bullet",
      body: "Critique this resume bullet please",
    });
    expect(res.improved).toContain("# Role");
    expect(res.qualityScore).toBeGreaterThan(50);
  });

  it("generateDigest summarizes inputs", async () => {
    const res = await generateDigest({
      items: [{ title: "X", category: "AI Agents" }],
      projects: [{ title: "RAG", whyItMatters: "Synth" }],
      reminders: [{ title: "Build it", dueAt: new Date() }],
    });
    expect(res.bullets.length).toBeGreaterThan(0);
  });
});

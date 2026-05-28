import { describe, it, expect } from "vitest";
import {
  heuristicCategory,
  heuristicScores,
  heuristicTags,
  heuristicSummary,
  heuristicNextAction,
} from "@/lib/scoring";

describe("heuristic scoring", () => {
  it("classifies AI agent content", () => {
    expect(heuristicCategory("Build an AI agent with MCP and tool use")).toBe(
      "AI Agents",
    );
  });

  it("classifies job content", () => {
    expect(heuristicCategory("How to write a resume that gets callbacks")).toBe(
      "Job Automation",
    );
  });

  it("scores known keywords higher", () => {
    const noisy = heuristicScores("random news article about cats");
    const sharp = heuristicScores(
      "MCP agent with RAG and vector store retrieval and SaaS portfolio",
    );
    expect(sharp.actionability).toBeGreaterThan(noisy.actionability);
    expect(sharp.portfolioValue).toBeGreaterThan(noisy.portfolioValue);
  });

  it("returns kebab-case tags", () => {
    const tags = heuristicTags("MCP agent with RAG and vector DB ideas");
    expect(tags.length).toBeGreaterThan(0);
    expect(tags.every((t) => /^[a-z0-9-]+$/.test(t))).toBe(true);
  });

  it("summary returns first sentences", () => {
    const s = heuristicSummary("Title", "Sentence one. Sentence two. Sentence three.");
    expect(s.startsWith("Sentence one.")).toBe(true);
  });

  it("suggests a next action per category", () => {
    expect(heuristicNextAction("AI Agents", "")).toMatch(/agent/i);
    expect(heuristicNextAction("Job Automation", "")).toMatch(/job-search/i);
  });
});

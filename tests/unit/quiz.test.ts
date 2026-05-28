import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { generateQuiz } from "@/lib/ai/generateQuiz";

describe("generateQuiz fallback", () => {
  const originals: Record<string, string | undefined> = {};
  const KEYS = [
    "GOOGLE_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "GROQ_API_KEY",
    "MISTRAL_API_KEY",
  ];

  beforeEach(() => {
    for (const k of KEYS) {
      originals[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of KEYS) {
      if (originals[k] === undefined) delete process.env[k];
      else process.env[k] = originals[k];
    }
  });

  it("returns 3 multiple-choice questions when no provider is configured", async () => {
    const quiz = await generateQuiz({
      title: "Building RAG with pgvector",
      summary: "A walk-through of vector search using Postgres pgvector.",
      tags: ["rag", "pgvector"],
      category: "AI Agents",
    });
    expect(quiz.provider).toBe("mock");
    expect(quiz.questions).toHaveLength(3);
    for (const q of quiz.questions) {
      expect(q.options).toHaveLength(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(4);
      expect(q.q.length).toBeGreaterThan(0);
      expect(q.explanation.length).toBeGreaterThan(0);
    }
  });
});

import { describe, it, expect, beforeEach } from "vitest";
import { activeProviderName } from "@/lib/ai/provider";

describe("AI provider priority", () => {
  beforeEach(() => {
    delete process.env.GOOGLE_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.MISTRAL_API_KEY;
  });

  it("defaults to mock with no keys", () => {
    expect(activeProviderName()).toBe("mock");
  });

  it("picks gemini first when GOOGLE_API_KEY is set", () => {
    process.env.GOOGLE_API_KEY = "g";
    process.env.OPENAI_API_KEY = "o";
    expect(activeProviderName()).toBe("gemini");
  });

  it("picks openai when only OPENAI_API_KEY is set", () => {
    process.env.OPENAI_API_KEY = "o";
    expect(activeProviderName()).toBe("openai");
  });

  it("picks anthropic over groq when both set", () => {
    process.env.ANTHROPIC_API_KEY = "a";
    process.env.GROQ_API_KEY = "g";
    expect(activeProviderName()).toBe("anthropic");
  });

  it("picks groq over mistral", () => {
    process.env.GROQ_API_KEY = "g";
    process.env.MISTRAL_API_KEY = "m";
    expect(activeProviderName()).toBe("groq");
  });

  it("picks mistral when only MISTRAL_API_KEY is set", () => {
    process.env.MISTRAL_API_KEY = "m";
    expect(activeProviderName()).toBe("mistral");
  });
});

export type AiProviderName = "gemini" | "openai" | "anthropic" | "groq" | "mistral" | "mock";

export interface AiCompletion {
  text: string;
  provider: AiProviderName;
  ms: number;
}

export interface AiProvider {
  name: AiProviderName;
  complete(opts: { system?: string; user: string; json?: boolean }): Promise<AiCompletion>;
}

function pickProvider(): AiProviderName {
  if (process.env.GOOGLE_API_KEY) return "gemini";
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.GROQ_API_KEY) return "groq";
  if (process.env.MISTRAL_API_KEY) return "mistral";
  return "mock";
}

const mockProvider: AiProvider = {
  name: "mock",
  async complete({ user }) {
    const t = Date.now();
    // Deterministic stub completion. Used when no API key is configured.
    const text = JSON.stringify({
      ok: true,
      echo: user.slice(0, 240),
      note: "mock-provider",
    });
    return { text, provider: "mock", ms: Date.now() - t };
  },
};

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  // Gemini often wraps JSON in ```json ... ``` fences. Strip them.
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  if (fenced) return fenced[1].trim();
  return trimmed;
}

async function geminiProvider(): Promise<AiProvider> {
  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const client = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY as string);
  const model = client.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { responseMimeType: "application/json" },
  });
  return {
    name: "gemini",
    async complete({ system, user, json }) {
      const t = Date.now();
      const prompt = [system, user, json ? "Respond ONLY with valid JSON. No markdown fences." : ""]
        .filter(Boolean)
        .join("\n\n");
      const res = await model.generateContent(prompt);
      const text = json ? stripJsonFence(res.response.text()) : res.response.text();
      return { text, provider: "gemini", ms: Date.now() - t };
    },
  };
}

async function openaiProvider(): Promise<AiProvider> {
  const OpenAI = (await import("openai")).default;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return {
    name: "openai",
    async complete({ system, user, json }) {
      const t = Date.now();
      const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          { role: "user" as const, content: user },
        ],
        response_format: json ? { type: "json_object" } : undefined,
        temperature: 0.4,
      });
      return {
        text: res.choices[0]?.message?.content ?? "",
        provider: "openai",
        ms: Date.now() - t,
      };
    },
  };
}

async function anthropicProvider(): Promise<AiProvider> {
  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return {
    name: "anthropic",
    async complete({ system, user, json }) {
      const t = Date.now();
      const res = await client.messages.create({
        model: "claude-3-5-haiku-latest",
        max_tokens: 1024,
        system: json ? `${system ?? ""}\nReturn only valid JSON.` : system,
        messages: [{ role: "user", content: user }],
      });
      const text = res.content
        .map((b) => ("text" in b ? b.text : ""))
        .join("\n");
      return { text, provider: "anthropic", ms: Date.now() - t };
    },
  };
}

async function groqProvider(): Promise<AiProvider> {
  const Groq = (await import("groq-sdk")).default;
  const client = new Groq({ apiKey: process.env.GROQ_API_KEY });
  return {
    name: "groq",
    async complete({ system, user, json }) {
      const t = Date.now();
      const res = await client.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          { role: "user" as const, content: user },
        ],
        response_format: json ? { type: "json_object" } : undefined,
        temperature: 0.4,
      });
      return {
        text: res.choices[0]?.message?.content ?? "",
        provider: "groq",
        ms: Date.now() - t,
      };
    },
  };
}

async function mistralProvider(): Promise<AiProvider> {
  const { Mistral } = await import("@mistralai/mistralai");
  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY as string });
  return {
    name: "mistral",
    async complete({ system, user, json }) {
      const t = Date.now();
      const res = await client.chat.complete({
        model: "mistral-small-latest",
        messages: [
          ...(system ? [{ role: "system" as const, content: system }] : []),
          { role: "user" as const, content: user },
        ],
        responseFormat: json ? { type: "json_object" } : undefined,
        temperature: 0.4,
      });
      const content = res.choices?.[0]?.message?.content ?? "";
      const text = typeof content === "string"
        ? content
        : Array.isArray(content)
          ? content.map((c) => ("text" in c ? c.text : "")).join("\n")
          : "";
      return { text, provider: "mistral", ms: Date.now() - t };
    },
  };
}

export async function getProvider(): Promise<AiProvider> {
  const name = pickProvider();
  try {
    if (name === "gemini") return await geminiProvider();
    if (name === "openai") return await openaiProvider();
    if (name === "anthropic") return await anthropicProvider();
    if (name === "groq") return await groqProvider();
    if (name === "mistral") return await mistralProvider();
  } catch (err) {
    console.warn(`[ai] provider ${name} init failed, using mock`, err);
  }
  return mockProvider;
}

export function activeProviderName(): AiProviderName {
  return pickProvider();
}

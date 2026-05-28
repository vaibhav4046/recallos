import { getProvider } from "./provider";

const SYSTEM = `You are RecallOS, a prompt engineer. Rewrite the given prompt to be sharper, more reusable, and structured. Respond as JSON:
{ "improved": string, "qualityScore": 0-100, "rationale": string }`;

export interface ImproveInput {
  title: string;
  body: string;
}

export interface ImproveResult {
  improved: string;
  qualityScore: number;
  rationale: string;
  provider: string;
}

function fallback(input: ImproveInput): ImproveResult {
  const cleaned = input.body
    .replace(/\s+/g, " ")
    .replace(/please|kindly/gi, "")
    .trim();
  const improved = `# Role\nYou are an expert engineer.\n\n# Context\n${cleaned}\n\n# Output\n- Crisp answer in numbered steps\n- Cite assumptions explicitly\n- Stop when done — no fluff`;
  const score = Math.min(95, 60 + Math.floor(cleaned.length / 60));
  return {
    improved,
    qualityScore: score,
    rationale: "Added role, context, and output spec sections for reusability.",
    provider: "mock",
  };
}

export async function improvePrompt(input: ImproveInput): Promise<ImproveResult> {
  const provider = await getProvider();
  if (provider.name === "mock") return fallback(input);
  try {
    const res = await provider.complete({
      system: SYSTEM,
      user: `Title: ${input.title}\n\nPrompt:\n${input.body}`,
      json: true,
    });
    const parsed = JSON.parse(res.text);
    return {
      improved: String(parsed.improved ?? input.body),
      qualityScore: Number(parsed.qualityScore ?? 75),
      rationale: String(parsed.rationale ?? ""),
      provider: provider.name,
    };
  } catch {
    return fallback(input);
  }
}

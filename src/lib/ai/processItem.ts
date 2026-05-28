import { getProvider } from "./provider";
import {
  heuristicCategory,
  heuristicNextAction,
  heuristicScores,
  heuristicSummary,
  heuristicTags,
  Scores,
} from "../scoring";
import { detectPlatform } from "../utils";

export interface ProcessInput {
  title: string;
  url?: string | null;
  rawContent?: string | null;
  kind: string;
  intent?: string | null;
}

export interface ProcessResult {
  summary: string;
  category: string;
  tags: string[];
  scores: Scores;
  nextAction: string;
  sourcePlatform: string;
  reminderSuggestion?: string;
  provider: string;
}

const SYSTEM_PROMPT = `You are Musemint, an AI that classifies and summarizes saved web/media/text content for a builder. Always respond as compact JSON with this shape:
{
  "summary": string (1-2 crisp sentences, no fluff),
  "category": one of [AI Agents, Job Automation, UI Inspiration, Data Science, Prompt Engineering, Full-stack Projects, Learning Resources, Content Ideas, General],
  "tags": string[] (3-6 kebab-case tags),
  "scores": { "usefulness": 0-100, "actionability": 0-100, "portfolioValue": 0-100, "confidence": 0-100 },
  "nextAction": string (short imperative, what to do next),
  "reminderSuggestion": string (one short reminder, may be empty)
}`;

function buildUserPrompt(input: ProcessInput) {
  return [
    `Title: ${input.title}`,
    input.url ? `URL: ${input.url}` : "",
    `Kind: ${input.kind}`,
    input.intent ? `User intent: ${input.intent}` : "",
    input.rawContent ? `Content:\n${input.rawContent.slice(0, 4000)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function fallback(input: ProcessInput): ProcessResult {
  const text = `${input.title}\n${input.rawContent ?? ""}\n${input.url ?? ""}`;
  const category = heuristicCategory(text);
  return {
    summary: heuristicSummary(input.title, input.rawContent),
    category,
    tags: heuristicTags(text),
    scores: heuristicScores(text),
    nextAction: heuristicNextAction(category, text),
    sourcePlatform: detectPlatform(input.url) || input.kind,
    reminderSuggestion: undefined,
    provider: "mock",
  };
}

export async function processItem(input: ProcessInput): Promise<ProcessResult> {
  const provider = await getProvider();
  if (provider.name === "mock") return fallback(input);
  try {
    const res = await provider.complete({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(input),
      json: true,
    });
    const parsed = JSON.parse(res.text);
    const sourcePlatform = detectPlatform(input.url) || input.kind;
    return {
      summary: String(parsed.summary ?? "").slice(0, 600),
      category: String(parsed.category ?? "General"),
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 8).map(String) : [],
      scores: {
        usefulness: Number(parsed.scores?.usefulness ?? 60),
        actionability: Number(parsed.scores?.actionability ?? 55),
        portfolioValue: Number(parsed.scores?.portfolioValue ?? 50),
        confidence: Number(parsed.scores?.confidence ?? 70),
      },
      nextAction: String(parsed.nextAction ?? "Review in Inbox"),
      reminderSuggestion: parsed.reminderSuggestion
        ? String(parsed.reminderSuggestion)
        : undefined,
      sourcePlatform,
      provider: provider.name,
    };
  } catch (err) {
    console.warn("[ai] processItem fallback:", err);
    return fallback(input);
  }
}

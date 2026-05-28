import { clamp } from "./utils";

export type Scores = {
  usefulness: number;
  actionability: number;
  portfolioValue: number;
  confidence: number;
};

const KEYWORD_BOOST: Record<string, Partial<Scores>> = {
  agent: { actionability: 18, portfolioValue: 14 },
  rag: { actionability: 14, portfolioValue: 18 },
  resume: { actionability: 24, usefulness: 10 },
  recruiter: { actionability: 20 },
  prompt: { usefulness: 14, portfolioValue: 8 },
  mcp: { portfolioValue: 22, actionability: 14 },
  dashboard: { portfolioValue: 16 },
  vector: { portfolioValue: 14 },
  github: { portfolioValue: 18 },
  saas: { portfolioValue: 14, actionability: 10 },
  interview: { actionability: 18 },
  ui: { portfolioValue: 12 },
  job: { actionability: 18 },
};

export function heuristicScores(text: string): Scores {
  const lower = text.toLowerCase();
  const length = text.length;
  let usefulness = clamp(40 + Math.min(40, Math.floor(length / 80)));
  let actionability = 45;
  let portfolioValue = 40;
  let confidence = clamp(60 + Math.floor(length / 220));

  for (const [k, v] of Object.entries(KEYWORD_BOOST)) {
    if (lower.includes(k)) {
      usefulness = clamp(usefulness + (v.usefulness ?? 4));
      actionability = clamp(actionability + (v.actionability ?? 4));
      portfolioValue = clamp(portfolioValue + (v.portfolioValue ?? 4));
      confidence = clamp(confidence + 3);
    }
  }
  return { usefulness, actionability, portfolioValue, confidence };
}

const CATEGORY_MATCHERS: Array<[RegExp, string]> = [
  [/agent|autonomous|crew|langgraph|tool.?use/i, "AI Agents"],
  [/resume|recruiter|interview|cover.?letter|job|apply|outreach/i, "Job Automation"],
  [/dashboard|ui|interface|design|figma|component/i, "UI Inspiration"],
  [/data|notebook|pandas|polars|warehouse|etl|pipeline/i, "Data Science"],
  [/prompt|system prompt|jailbreak|persona/i, "Prompt Engineering"],
  [/saas|product|landing|monetiz|build|launch/i, "Full-stack Projects"],
  [/course|learn|tutorial|book|lecture/i, "Learning Resources"],
  [/post|blog|thread|caption|carousel|tweet/i, "Content Ideas"],
];

export function heuristicCategory(text: string): string {
  for (const [re, label] of CATEGORY_MATCHERS) {
    if (re.test(text)) return label;
  }
  return "General";
}

export function heuristicTags(text: string): string[] {
  const lower = text.toLowerCase();
  const tags = new Set<string>();
  const dict = [
    "ai-agents",
    "rag",
    "mcp",
    "prompts",
    "resume",
    "interview",
    "dashboard",
    "ui",
    "saas",
    "github",
    "vector-db",
    "langchain",
    "career",
    "learning",
    "content",
    "data",
  ];
  for (const tag of dict) {
    if (lower.includes(tag.replace(/-/g, " ")) || lower.includes(tag)) tags.add(tag);
  }
  if (tags.size === 0) tags.add("ideas");
  return Array.from(tags).slice(0, 6);
}

export function heuristicSummary(title: string, body?: string | null): string {
  const sentences = (body ?? title)
    .replace(/\s+/g, " ")
    .split(/(?<=\.)\s|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length === 0) return title;
  return sentences.slice(0, 2).join(" ");
}

export function heuristicNextAction(category: string, text: string): string {
  const lower = text.toLowerCase();
  if (category === "AI Agents") return "Spec the agent + draft tool list";
  if (category === "Job Automation") return "Convert to job-search action";
  if (category === "UI Inspiration") return "Save as reference + sketch";
  if (category === "Prompt Engineering") return "Promote to Prompt Library";
  if (category === "Full-stack Projects") return "Open Build Pack draft";
  if (category === "Learning Resources") return "Queue for weekend study";
  if (category === "Content Ideas") return "Send to Content Studio";
  if (lower.includes("resume")) return "Add resume bullet draft";
  return "Review in Inbox";
}

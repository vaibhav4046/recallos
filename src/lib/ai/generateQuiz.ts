import { getProvider } from "./provider";
import { stripMarkdown } from "../utils";

export interface QuizInput {
  title: string;
  summary?: string | null;
  rawContent?: string | null;
  tags?: string[];
  category?: string | null;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface QuizResult {
  questions: QuizQuestion[];
  provider: string;
}

function topicWord(input: QuizInput): string {
  const tag = (input.tags ?? [])[0];
  return tag || input.category || "the topic";
}

function fallback(input: QuizInput): QuizResult {
  const topic = topicWord(input);
  const t = input.title;
  const summary = (input.summary ?? input.rawContent ?? "").trim().slice(0, 240);
  const questions: QuizQuestion[] = [
    {
      q: `What is the core idea behind "${t}"?`,
      options: [
        summary || `A practical approach to ${topic}.`,
        `An unrelated marketing pitch.`,
        `A deprecated API specification.`,
        `Pure entertainment, no takeaways.`,
      ],
      answerIndex: 0,
      explanation: `The title and summary frame "${t}" as a practical resource about ${topic}.`,
    },
    {
      q: `Which audience would benefit most from this saved item?`,
      options: [
        `Builders shipping work in ${topic}.`,
        `Hobbyists with no interest in ${topic}.`,
        `Customer support agents only.`,
        `Pure academics avoiding implementation.`,
      ],
      answerIndex: 0,
      explanation: `Musemint flagged this as actionable for builders working on ${topic}.`,
    },
    {
      q: `What is a smart next step after consuming this?`,
      options: [
        `Build a tiny demo applying one idea from it.`,
        `Forget it and move on.`,
        `Repost it without reading.`,
        `Pay someone to read it for you.`,
      ],
      answerIndex: 0,
      explanation: `Musemint's learning loop is: consume → distill → ship a tangible artifact.`,
    },
  ];
  return { questions, provider: "mock" };
}

const SYSTEM = `You are Musemint, a learning coach. Given a saved learning resource, produce a 3-question multiple-choice quiz that tests genuine understanding (not trivia about the source). Respond ONLY as JSON:
{ "questions": [ { "q": string, "options": string[4], "answerIndex": 0-3, "explanation": string }, ... ] }
Rules:
- Exactly 3 questions.
- Each question has exactly 4 options.
- "answerIndex" is the 0-based index of the correct option.
- Keep questions specific to the resource's actual content; don't ask about metadata.
`;

export async function generateQuiz(input: QuizInput): Promise<QuizResult> {
  const provider = await getProvider();
  if (provider.name === "mock") return fallback(input);
  try {
    const user = [
      `Title: ${input.title}`,
      input.category ? `Category: ${input.category}` : "",
      input.tags?.length ? `Tags: ${input.tags.join(", ")}` : "",
      input.summary ? `Summary:\n${input.summary}` : "",
      input.rawContent ? `Content:\n${input.rawContent.slice(0, 4000)}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
    const res = await provider.complete({ system: SYSTEM, user, json: true });
    const parsed = JSON.parse(res.text);
    const raw = Array.isArray(parsed.questions) ? parsed.questions : [];
    const questions: QuizQuestion[] = raw
      .slice(0, 5)
      .map((q: any) => ({
        q: stripMarkdown(String(q.q ?? "")),
        options: Array.isArray(q.options)
          ? q.options.slice(0, 4).map((o: unknown) => stripMarkdown(String(o)))
          : [],
        answerIndex: Math.min(3, Math.max(0, Number(q.answerIndex ?? 0))),
        explanation: stripMarkdown(String(q.explanation ?? "")),
      }))
      .filter(
        (q: QuizQuestion) => q.q && q.options.length === 4,
      );
    if (questions.length < 3) return fallback(input);
    return { questions, provider: provider.name };
  } catch {
    return fallback(input);
  }
}

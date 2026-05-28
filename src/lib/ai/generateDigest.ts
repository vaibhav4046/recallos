import { getProvider } from "./provider";

export interface DigestInput {
  items: { title: string; summary?: string | null; category?: string | null }[];
  projects: { title: string; whyItMatters: string }[];
  reminders: { title: string; dueAt: Date }[];
}

export interface DigestResult {
  headline: string;
  bullets: string[];
  cta: string;
  provider: string;
}

function fallback(input: DigestInput): DigestResult {
  const top = input.items.slice(0, 3).map((i) => i.title);
  const buildable = input.projects.slice(0, 2).map((p) => p.title);
  const due = input.reminders.slice(0, 2).map((r) => r.title);
  const bullets = [
    top.length ? `Top captures: ${top.join("; ")}` : "No new captures today",
    buildable.length ? `Ready to build: ${buildable.join(", ")}` : "No new project ideas",
    due.length ? `Due soon: ${due.join(", ")}` : "No reminders due",
  ];
  return {
    headline: "Your daily Musemint digest",
    bullets,
    cta: buildable[0]
      ? `Open the build pack for "${buildable[0]}"`
      : "Capture something new from the share sheet",
    provider: "mock",
  };
}

const SYSTEM = `You are Musemint. Produce a tight 3-bullet daily digest as JSON:
{ "headline": string, "bullets": string[3-4], "cta": string }`;

export async function generateDigest(input: DigestInput): Promise<DigestResult> {
  const provider = await getProvider();
  if (provider.name === "mock") return fallback(input);
  try {
    const user = [
      "Items:",
      ...input.items.map((i) => `- ${i.title}${i.category ? ` [${i.category}]` : ""}`),
      "Projects:",
      ...input.projects.map((p) => `- ${p.title}: ${p.whyItMatters}`),
      "Reminders:",
      ...input.reminders.map(
        (r) => `- ${r.title} (due ${new Date(r.dueAt).toISOString()})`,
      ),
    ].join("\n");
    const res = await provider.complete({ system: SYSTEM, user, json: true });
    const parsed = JSON.parse(res.text);
    return {
      headline: String(parsed.headline ?? "Your daily Musemint digest"),
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets.map(String) : fallback(input).bullets,
      cta: String(parsed.cta ?? "Open the inbox"),
      provider: provider.name,
    };
  } catch {
    return fallback(input);
  }
}

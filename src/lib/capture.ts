import { z } from "zod";
import { prisma, getDemoUser } from "./prisma";
import { detectPlatform } from "./utils";
import { processItem } from "./ai/processItem";

export const CaptureSchema = z.object({
  kind: z.enum([
    "url",
    "note",
    "prompt",
    "screenshot",
    "youtube",
    "linkedin",
    "instagram",
    "github",
    "article",
    "text",
  ]),
  url: z.string().url().optional().or(z.literal("")).optional(),
  title: z.string().min(1).max(280).optional(),
  rawContent: z.string().max(20_000).optional(),
  intent: z
    .enum([
      "remember",
      "project",
      "prompt",
      "learn",
      "jobsearch",
      "reminder",
      "summarize",
      "auto",
    ])
    .default("auto"),
  process: z.boolean().default(true),
});

export type CaptureInput = z.infer<typeof CaptureSchema>;

function deriveTitle(input: CaptureInput): string {
  if (input.title?.trim()) return input.title.trim();
  if (input.url) {
    try {
      const u = new URL(input.url);
      const last = u.pathname.split("/").filter(Boolean).pop();
      if (last) return `${u.hostname} · ${decodeURIComponent(last).slice(0, 80)}`;
      return u.hostname;
    } catch {
      return input.url.slice(0, 80);
    }
  }
  if (input.rawContent) {
    return input.rawContent.split("\n")[0].slice(0, 80) || "Untitled capture";
  }
  return "Untitled capture";
}

export async function createCapture(input: CaptureInput) {
  const user = await getDemoUser();
  const title = deriveTitle(input);
  const sourcePlatform =
    detectPlatform(input.url) || (input.kind === "note" ? "note" : input.kind);

  let processed:
    | Awaited<ReturnType<typeof processItem>>
    | null = null;
  if (input.process) {
    processed = await processItem({
      title,
      url: input.url ?? null,
      rawContent: input.rawContent ?? null,
      kind: input.kind,
      intent: input.intent,
    });
  }

  const tags = processed?.tags ?? [];
  const tagRecords = await Promise.all(
    tags.map((name) =>
      prisma.tag.upsert({ where: { name }, update: {}, create: { name } }),
    ),
  );

  const item = await prisma.capturedItem.create({
    data: {
      userId: user.id,
      kind: input.kind,
      sourcePlatform: processed?.sourcePlatform ?? sourcePlatform,
      url: input.url || null,
      rawContent: input.rawContent || null,
      title,
      summary: processed?.summary ?? null,
      category: processed?.category ?? null,
      tagsJson: JSON.stringify(tags),
      metadataJson: "{}",
      scoresJson: JSON.stringify(
        processed?.scores ?? {
          usefulness: 0,
          actionability: 0,
          portfolioValue: 0,
          confidence: 0,
        },
      ),
      nextAction: processed?.nextAction ?? null,
      intent: input.intent,
      isProcessed: !!processed,
      processedAt: processed ? new Date() : null,
      tags: { connect: tagRecords.map((t) => ({ id: t.id })) },
    },
  });

  await prisma.aiProcessingLog.create({
    data: {
      userId: user.id,
      itemId: item.id,
      provider: processed?.provider ?? "mock",
      task: "process",
      ok: true,
      ms: 0,
      notes: processed ? "capture+process" : "capture only",
    },
  });

  return item;
}

import { z } from "zod";
import { prisma, getDemoUser } from "./prisma";
import { detectPlatform } from "./utils";
import { processItem } from "./ai/processItem";
import { fetchYouTubeMetadata } from "./enrich/youtube";
import { embedText, vectorLiteral } from "./embed";
import { describeImage } from "./ai/vision";

const URL_KINDS = new Set(["url", "youtube", "linkedin", "instagram", "github", "article"]);
const TEXT_KINDS = new Set(["note", "prompt", "text"]);

export const CaptureSchema = z
  .object({
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
    imageData: z.string().max(9_000_000).optional(),
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
  })
  .superRefine((data, ctx) => {
    const url = data.url?.trim();
    const raw = data.rawContent?.trim();
    const title = data.title?.trim();
    const hasImage = !!data.imageData && data.imageData.length > 100;

    if (URL_KINDS.has(data.kind)) {
      if (!url && !raw && !title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `A ${data.kind} capture needs a URL, title, or notes.`,
          path: ["url"],
        });
      }
    } else if (TEXT_KINDS.has(data.kind)) {
      if (!raw && !title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `A ${data.kind} capture needs body content or a title.`,
          path: ["rawContent"],
        });
      }
    } else if (data.kind === "screenshot") {
      if (!hasImage && !raw && !title) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "A screenshot capture needs an image, notes, or a title.",
          path: ["imageData"],
        });
      }
    }
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
  const sourcePlatform =
    detectPlatform(input.url) || (input.kind === "note" ? "note" : input.kind);

  // YouTube enrichment — pulls real title, channel, description, duration, views.
  let youtube: Awaited<ReturnType<typeof fetchYouTubeMetadata>> = null;
  if (sourcePlatform === "youtube" && input.url) {
    youtube = await fetchYouTubeMetadata(input.url);
  }

  let enrichedTitle = youtube?.title || deriveTitle(input);
  let enrichedRaw = youtube
    ? [youtube.description, input.rawContent].filter(Boolean).join("\n\n")
    : input.rawContent ?? null;

  // Screenshot understanding — real OCR + scene description via Gemini vision.
  if (input.process && input.kind === "screenshot" && input.imageData) {
    const vision = await describeImage(input.imageData);
    if (vision) {
      enrichedRaw =
        [vision.text, input.rawContent].filter(Boolean).join("\n\n") || null;
      if (!input.title?.trim() && vision.summary) {
        enrichedTitle = vision.summary.slice(0, 120);
      }
    }
  }

  let processed:
    | Awaited<ReturnType<typeof processItem>>
    | null = null;
  if (input.process) {
    processed = await processItem({
      title: enrichedTitle,
      url: input.url ?? null,
      rawContent: enrichedRaw,
      kind: input.kind,
      intent: input.intent,
    });
  }
  const title = enrichedTitle;

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
      rawContent: enrichedRaw,
      title,
      summary: processed?.summary ?? null,
      category: processed?.category ?? null,
      tagsJson: JSON.stringify(tags),
      metadataJson: JSON.stringify(
        youtube
          ? {
              channel: youtube.channel,
              publishedAt: youtube.publishedAt,
              durationSec: youtube.durationSec,
              viewCount: youtube.viewCount,
              thumbnail: youtube.thumbnail,
              videoId: youtube.videoId,
            }
          : {},
      ),
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

  // Embed for semantic search. Stored as pgvector via raw SQL.
  try {
    const embedText_src = [
      title,
      processed?.summary,
      enrichedRaw,
      tags.join(" "),
      processed?.category,
    ]
      .filter(Boolean)
      .join("\n");
    const vec = await embedText(embedText_src);
    if (vec) {
      await prisma.$executeRawUnsafe(
        `UPDATE "CapturedItem" SET embedding = $1::vector WHERE id = $2`,
        vectorLiteral(vec),
        item.id,
      );
    }
  } catch (e) {
    console.warn("[embed] capture skipped", e);
  }

  return item;
}

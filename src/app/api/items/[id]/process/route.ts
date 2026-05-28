import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { processItem } from "@/lib/ai/processItem";
import { enforce } from "@/lib/ratelimit";
import { handle } from "@/lib/api";

export const POST = handle(async (req, { params }) => {
  const blocked = await enforce(req, { name: "process", limit: 40, windowMs: 60_000, ai: true });
  if (blocked) return blocked;
  const user = await getDemoUser();
  const existing = await prisma.capturedItem.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const t = Date.now();
  const result = await processItem({
    title: existing.title,
    url: existing.url,
    rawContent: existing.rawContent,
    kind: existing.kind,
    intent: existing.intent,
  });

  const item = await prisma.capturedItem.update({
    where: { id: existing.id },
    data: {
      summary: result.summary,
      category: result.category,
      tagsJson: JSON.stringify(result.tags),
      scoresJson: JSON.stringify(result.scores),
      nextAction: result.nextAction,
      isProcessed: true,
      processedAt: new Date(),
      sourcePlatform: result.sourcePlatform,
    },
  });
  await prisma.aiProcessingLog.create({
    data: {
      userId: existing.userId,
      itemId: item.id,
      provider: result.provider,
      task: "process",
      ok: true,
      ms: Date.now() - t,
    },
  });
  return NextResponse.json({ item, result });
});

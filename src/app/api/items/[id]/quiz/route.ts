import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { handle } from "@/lib/api";
import { enforce } from "@/lib/ratelimit";
import { generateQuiz } from "@/lib/ai/generateQuiz";

export const POST = handle(async (req, { params }) => {
  const blocked = await enforce(req, { name: "quiz", limit: 20, windowMs: 60_000, ai: true });
  if (blocked) return blocked;
  const user = await getDemoUser();
  const item = await prisma.capturedItem.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const tags = parseJson<string[]>(item.tagsJson, []);
  const quiz = await generateQuiz({
    title: item.title,
    summary: item.summary,
    rawContent: item.rawContent,
    tags,
    category: item.category,
  });
  return NextResponse.json(quiz);
});

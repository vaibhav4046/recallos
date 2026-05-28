import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const item = await prisma.capturedItem.findUnique({ where: { id: params.id } });
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const user = await getDemoUser();
  const scores = parseJson<{ portfolioValue: number; actionability: number; confidence: number }>(
    item.scoresJson,
    { portfolioValue: 60, actionability: 60, confidence: 70 },
  );
  const tags = parseJson<string[]>(item.tagsJson, []);
  const stack =
    tags.some((t) => t.includes("rag") || t.includes("vector"))
      ? ["Next.js", "Prisma", "pgvector", "OpenAI"]
      : tags.some((t) => t.includes("agent") || t.includes("mcp"))
        ? ["TypeScript", "Next.js", "MCP SDK", "Zod"]
        : ["Next.js", "Prisma", "Tailwind", "Gemini"];

  const project = await prisma.projectIdea.create({
    data: {
      userId: user.id,
      title: item.title,
      whyItMatters:
        item.summary ?? `Synthesizes saved context from ${item.sourcePlatform}.`,
      sourceItemsJson: JSON.stringify([item.id]),
      difficulty: scores.portfolioValue > 80 ? "Intermediate" : "Beginner",
      estBuildTime: "1 weekend",
      techStackJson: JSON.stringify(stack),
      githubScore: Math.min(95, scores.portfolioValue + 5),
      portfolioValue: scores.portfolioValue,
    },
  });

  await prisma.capturedItem.update({
    where: { id: item.id },
    data: { status: "kept", projectId: project.id, intent: "project" },
  });

  return NextResponse.json({ project });
}

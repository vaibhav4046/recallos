import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import {
  generateBuildPack,
  packToChecklist,
  packToMarkdown,
} from "@/lib/ai/generateBuildPack";
import { enforce } from "@/lib/ratelimit";
import { handle } from "@/lib/api";

export const POST = handle(async (req, { params }) => {
  const blocked = await enforce(req, { name: "buildpack", limit: 20, windowMs: 60_000, ai: true });
  if (blocked) return blocked;
  const user = await getDemoUser();
  const project = await prisma.projectIdea.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const sourceIds = parseJson<string[]>(project.sourceItemsJson, []);
  const sourceItems = sourceIds.length
    ? await prisma.capturedItem.findMany({
        where: { id: { in: sourceIds }, userId: user.id },
      })
    : [];

  const techStack = parseJson<string[]>(project.techStackJson, []);

  const t = Date.now();
  const { pack, provider } = await generateBuildPack({
    projectTitle: project.title,
    whyItMatters: project.whyItMatters,
    difficulty: project.difficulty,
    techStack,
    sourceItems: sourceItems.map((s) => ({
      title: s.title,
      summary: s.summary,
      url: s.url,
    })),
  });

  const markdown = packToMarkdown(project.title, pack);
  const readme = pack.readme;
  const checklist = packToChecklist(pack);

  const buildPack = await prisma.buildPack.create({
    data: {
      userId: user.id,
      projectId: project.id,
      contentJson: JSON.stringify(pack),
      markdown,
      readme,
      checklist,
    },
  });

  await prisma.projectIdea.update({
    where: { id: project.id },
    data: { status: "building" },
  });

  await prisma.aiProcessingLog.create({
    data: {
      userId: user.id,
      provider,
      task: "buildpack",
      ok: true,
      ms: Date.now() - t,
    },
  });

  return NextResponse.json({ buildPack });
});

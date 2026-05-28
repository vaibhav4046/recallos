import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import {
  generateBuildPack,
  packToChecklist,
  packToMarkdown,
} from "@/lib/ai/generateBuildPack";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const project = await prisma.projectIdea.findUnique({ where: { id: params.id } });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const user = await getDemoUser();

  const sourceIds = parseJson<string[]>(project.sourceItemsJson, []);
  const sourceItems = sourceIds.length
    ? await prisma.capturedItem.findMany({ where: { id: { in: sourceIds } } })
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
}

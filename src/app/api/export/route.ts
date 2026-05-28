import { NextResponse } from "next/server";
import { getDemoUser, prisma } from "@/lib/prisma";

export async function GET() {
  const user = await getDemoUser();
  const [items, projects, prompts, reminders, integrations, buildPacks] =
    await Promise.all([
      prisma.capturedItem.findMany({ where: { userId: user.id } }),
      prisma.projectIdea.findMany({ where: { userId: user.id } }),
      prisma.prompt.findMany({ where: { userId: user.id } }),
      prisma.reminder.findMany({ where: { userId: user.id } }),
      prisma.integration.findMany({ where: { userId: user.id } }),
      prisma.buildPack.findMany({ where: { userId: user.id } }),
    ]);
  const payload = {
    exportedAt: new Date().toISOString(),
    user: { email: user.email, name: user.name },
    items,
    projects,
    prompts,
    reminders,
    integrations,
    buildPacks,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="recallos-export.json"`,
    },
  });
}

export async function DELETE() {
  const user = await getDemoUser();
  await prisma.aiProcessingLog.deleteMany({ where: { userId: user.id } });
  await prisma.buildPack.deleteMany({ where: { userId: user.id } });
  await prisma.reminder.deleteMany({ where: { userId: user.id } });
  await prisma.prompt.deleteMany({ where: { userId: user.id } });
  await prisma.capturedItem.deleteMany({ where: { userId: user.id } });
  await prisma.projectIdea.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}

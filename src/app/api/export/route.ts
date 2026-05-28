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

const WIPE_PHRASE = "DELETE ALL MY DATA";

export async function DELETE(req: Request) {
  // Irreversible wipe — require an explicit typed confirmation phrase.
  const body = await req.json().catch(() => null);
  const confirm =
    (body && typeof body.confirm === "string" ? body.confirm : null) ??
    req.headers.get("x-recallos-confirm");
  if (confirm !== WIPE_PHRASE) {
    return NextResponse.json(
      {
        error: "confirmation_required",
        message: `Send { "confirm": "${WIPE_PHRASE}" } to wipe all data. This cannot be undone.`,
      },
      { status: 400 },
    );
  }
  const user = await getDemoUser();
  await prisma.aiProcessingLog.deleteMany({ where: { userId: user.id } });
  await prisma.buildPack.deleteMany({ where: { userId: user.id } });
  await prisma.reminder.deleteMany({ where: { userId: user.id } });
  await prisma.prompt.deleteMany({ where: { userId: user.id } });
  await prisma.capturedItem.deleteMany({ where: { userId: user.id } });
  await prisma.projectIdea.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}

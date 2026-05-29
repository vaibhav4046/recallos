import { NextResponse } from "next/server";
import { getDemoUser, prisma } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";

export async function GET(req: Request) {
  // Full-data dump — throttle to deter scraping of the whole dataset.
  const blocked = await enforce(req, { name: "export", limit: 6, windowMs: 60_000 });
  if (blocked) return blocked;
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
      "Content-Disposition": `attachment; filename="musemint-export.json"`,
    },
  });
}

const WIPE_PHRASES = new Set(["DELETE ALL MY DATA", "DELETE"]);

export async function DELETE(req: Request) {
  const blocked = await enforce(req, { name: "wipe", limit: 4, windowMs: 60_000 });
  if (blocked) return blocked;
  // Irreversible wipe — require an explicit typed confirmation phrase.
  const body = await req.json().catch(() => null);
  const confirm =
    (body && typeof body.confirm === "string" ? body.confirm : null) ??
    req.headers.get("x-musemint-confirm");
  if (!confirm || !WIPE_PHRASES.has(confirm)) {
    return NextResponse.json(
      {
        error: "confirmation_required",
        message: 'Send { "confirm": "DELETE" } to wipe all data. This cannot be undone.',
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

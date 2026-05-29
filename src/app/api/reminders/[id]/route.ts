import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";

const Schema = z.object({
  status: z.enum(["due", "done", "snoozed"]).optional(),
  snoozedTo: z.string().max(40).optional(),
  title: z.string().max(280).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const blocked = await enforce(req, { name: "reminder-patch", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const user = await getDemoUser();
  const owned = await prisma.reminder.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const reminder = await prisma.reminder.update({
    where: { id: params.id },
    data: {
      ...parsed.data,
      snoozedTo: parsed.data.snoozedTo ? new Date(parsed.data.snoozedTo) : undefined,
    },
  });
  return NextResponse.json({ reminder });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const blocked = await enforce(req, { name: "reminder-delete", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const user = await getDemoUser();
  const res = await prisma.reminder.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  if (res.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

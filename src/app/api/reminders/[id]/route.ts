import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";

const Schema = z.object({
  status: z.enum(["due", "done", "snoozed"]).optional(),
  snoozedTo: z.string().optional(),
  title: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
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

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  const res = await prisma.reminder.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  if (res.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

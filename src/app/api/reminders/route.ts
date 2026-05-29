import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";
import { listReminders } from "@/lib/queries";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const reminders = await listReminders();
  return NextResponse.json({ reminders });
}

const Schema = z.object({
  title: z.string().min(1).max(280),
  body: z.string().max(2_000).optional().nullable(),
  kind: z.string().max(40).default("forgotten"),
  dueAt: z.string().max(40),
  itemId: z.string().max(100).optional().nullable(),
});

export async function POST(req: Request) {
  const blocked = await enforce(req, { name: "reminder-create", limit: 30, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const user = await getDemoUser();
  const reminder = await prisma.reminder.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body ?? null,
      kind: parsed.data.kind,
      dueAt: new Date(parsed.data.dueAt),
      itemId: parsed.data.itemId ?? null,
    },
  });
  return NextResponse.json({ reminder });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";
import { listReminders } from "@/lib/queries";

export async function GET() {
  const reminders = await listReminders();
  return NextResponse.json({ reminders });
}

const Schema = z.object({
  title: z.string().min(1),
  body: z.string().optional().nullable(),
  kind: z.string().default("forgotten"),
  dueAt: z.string(),
  itemId: z.string().optional().nullable(),
});

export async function POST(req: Request) {
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

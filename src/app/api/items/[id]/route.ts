import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getItem } from "@/lib/queries";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await getItem(params.id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ item });
}

const PatchSchema = z.object({
  status: z.enum(["inbox", "kept", "archived", "trashed", "merged"]).optional(),
  intent: z.string().optional(),
  title: z.string().optional(),
  summary: z.string().optional(),
  category: z.string().optional(),
  nextAction: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const item = await prisma.capturedItem.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ item });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.capturedItem.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}

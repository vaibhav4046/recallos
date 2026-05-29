import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";
import { getItem } from "@/lib/queries";
import { enforce } from "@/lib/ratelimit";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const item = await getItem(params.id);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ item });
}

// Bound string lengths so a PATCH can't store unbounded blobs (capture has its
// own caps; this closes the same door on edits).
const PatchSchema = z.object({
  status: z.enum(["inbox", "kept", "archived", "trashed", "merged"]).optional(),
  intent: z.string().max(40).optional(),
  title: z.string().max(280).optional(),
  summary: z.string().max(2_000).optional(),
  category: z.string().max(120).optional(),
  nextAction: z.string().max(600).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const blocked = await enforce(req, { name: "item-patch", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = PatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  const user = await getDemoUser();
  const owned = await prisma.capturedItem.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const item = await prisma.capturedItem.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ item });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const blocked = await enforce(req, { name: "item-delete", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const user = await getDemoUser();
  const res = await prisma.capturedItem.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  if (res.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

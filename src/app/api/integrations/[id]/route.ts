import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";

const Schema = z.object({
  status: z.enum(["connected", "available", "needs_setup", "coming_soon"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const user = await getDemoUser();
  const owned = await prisma.integration.findFirst({
    where: { id: params.id, userId: user.id },
    select: { id: true },
  });
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const integration = await prisma.integration.update({
    where: { id: params.id },
    data: parsed.data,
  });
  return NextResponse.json({ integration });
}

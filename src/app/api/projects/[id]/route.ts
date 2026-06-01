import { NextResponse } from "next/server";
import { prisma, getDemoUser } from "@/lib/prisma";
import { parseJson } from "@/lib/utils";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const user = await getDemoUser();
  // Scope by owner so a project id from another user can never be read (IDOR).
  const project = await prisma.projectIdea.findFirst({
    where: { id: params.id, userId: user.id },
  });
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({
    project: {
      ...project,
      techStack: parseJson<string[]>(project.techStackJson, []),
      sourceItems: parseJson<string[]>(project.sourceItemsJson, []),
    },
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const blocked = await enforce(req, { name: "project-delete", limit: 40, windowMs: 60_000 });
  if (blocked) return blocked;
  const user = await getDemoUser();
  // deleteMany scoped to the owner: a non-owned or missing id deletes nothing
  // and returns 404 — never another user's project (IDOR-safe).
  const res = await prisma.projectIdea.deleteMany({
    where: { id: params.id, userId: user.id },
  });
  if (res.count === 0) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

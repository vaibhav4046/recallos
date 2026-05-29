import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";
import { listPrompts } from "@/lib/queries";
import { improvePrompt } from "@/lib/ai/improvePrompt";
import { enforce } from "@/lib/ratelimit";
import { handle } from "@/lib/api";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const prompts = await listPrompts();
  return NextResponse.json({ prompts });
}

const Schema = z.object({
  title: z.string().min(1).max(280),
  body: z.string().min(1).max(20_000),
  category: z.string().max(60).default("general"),
  tags: z.array(z.string().max(40)).max(20).default([]),
  improve: z.boolean().default(true),
});

export const POST = handle(async (req) => {
  const blocked = await enforce(req, { name: "prompts", limit: 40, windowMs: 60_000, ai: true });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  const user = await getDemoUser();
  let improved: string | null = null;
  let qualityScore = 60;
  if (parsed.data.improve) {
    const res = await improvePrompt({ title: parsed.data.title, body: parsed.data.body });
    improved = res.improved;
    qualityScore = res.qualityScore;
  }
  const prompt = await prisma.prompt.create({
    data: {
      userId: user.id,
      title: parsed.data.title,
      body: parsed.data.body,
      improvedBody: improved,
      category: parsed.data.category,
      qualityScore,
      tagsJson: JSON.stringify(parsed.data.tags),
    },
  });
  return NextResponse.json({ prompt });
});

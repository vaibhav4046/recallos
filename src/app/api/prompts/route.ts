import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma, getDemoUser } from "@/lib/prisma";
import { listPrompts } from "@/lib/queries";
import { improvePrompt } from "@/lib/ai/improvePrompt";

export async function GET() {
  const prompts = await listPrompts();
  return NextResponse.json({ prompts });
}

const Schema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  category: z.string().default("general"),
  tags: z.array(z.string()).default([]),
  improve: z.boolean().default(true),
});

export async function POST(req: Request) {
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
}

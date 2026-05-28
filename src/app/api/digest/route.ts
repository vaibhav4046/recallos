import { NextResponse } from "next/server";
import { generateDigest } from "@/lib/ai/generateDigest";
import { prisma, getDemoUser } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const user = await getDemoUser();
  const [items, projects, reminders] = await Promise.all([
    prisma.capturedItem.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.projectIdea.findMany({
      where: { userId: user.id },
      orderBy: { portfolioValue: "desc" },
      take: 4,
    }),
    prisma.reminder.findMany({
      where: { userId: user.id, status: "due" },
      orderBy: { dueAt: "asc" },
      take: 4,
    }),
  ]);
  const digest = await generateDigest({
    items: items.map((i) => ({
      title: i.title,
      summary: i.summary,
      category: i.category,
    })),
    projects: projects.map((p) => ({ title: p.title, whyItMatters: p.whyItMatters })),
    reminders: reminders.map((r) => ({ title: r.title, dueAt: r.dueAt })),
  });
  return NextResponse.json(digest);
}

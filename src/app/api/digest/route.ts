import { NextResponse } from "next/server";
import { generateDigest } from "@/lib/ai/generateDigest";
import { prisma, getDemoUser } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const blocked = await enforce(req, { name: "digest", limit: 30, windowMs: 60_000, ai: true });
  if (blocked) return blocked;
  const user = await getDemoUser();
  const [itemsRaw, projects, reminders] = await Promise.all([
    prisma.capturedItem.findMany({
      where: {
        userId: user.id,
        // Hide placeholder / empty captures from the digest.
        NOT: { title: { in: ["Untitled capture", "Untitled"] } },
      },
      orderBy: { createdAt: "desc" },
      take: 12,
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
  const items = itemsRaw
    .filter((i) => {
      const hasContent =
        (i.summary && i.summary.trim()) ||
        (i.rawContent && i.rawContent.trim()) ||
        (i.url && i.url.trim());
      return hasContent;
    })
    .slice(0, 8);
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

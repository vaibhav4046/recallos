import { NextResponse } from "next/server";
import { listItems } from "@/lib/queries";
import { embedQuery, vectorLiteral } from "@/lib/embed";
import { prisma, getDemoUser } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type SearchHit = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  sourcePlatform: string;
  score?: number;
};

export async function GET(req: Request) {
  const blocked = await enforce(req, { name: "search", limit: 60, windowMs: 60_000 });
  if (blocked) return blocked;
  const url = new URL(req.url);
  // Cap query length to bound DB / embedding work and reject abuse.
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 500);
  const semantic = url.searchParams.get("semantic") === "1";
  if (!q) return NextResponse.json({ items: [], mode: "empty" });

  if (semantic) {
    const vec = await embedQuery(q);
    if (vec) {
      const user = await getDemoUser();
      const rows = await prisma.$queryRawUnsafe<SearchHit[]>(
        `SELECT id, title, summary, category, "sourcePlatform",
                1 - (embedding <=> $1::vector) AS score
         FROM "CapturedItem"
         WHERE "userId" = $2 AND embedding IS NOT NULL
         ORDER BY embedding <=> $1::vector
         LIMIT 25`,
        vectorLiteral(vec),
        user.id,
      );
      return NextResponse.json({ items: rows, mode: "semantic", count: rows.length });
    }
    // Fall through to keyword if embedding unavailable.
  }

  const items = await listItems({ search: q, limit: 25 });
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      summary: i.summary,
      category: i.category,
      sourcePlatform: i.sourcePlatform,
    })),
    mode: "keyword",
    count: items.length,
  });
}

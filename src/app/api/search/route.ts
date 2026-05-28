import { NextResponse } from "next/server";
import { listItems } from "@/lib/queries";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  if (!q.trim()) return NextResponse.json({ items: [] });
  const items = await listItems({ search: q.trim(), limit: 25 });
  return NextResponse.json({
    items: items.map((i) => ({
      id: i.id,
      title: i.title,
      summary: i.summary,
      category: i.category,
      sourcePlatform: i.sourcePlatform,
    })),
  });
}

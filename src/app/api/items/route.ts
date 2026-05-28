import { NextResponse } from "next/server";
import { listItems } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const status = url.searchParams.get("status") ?? undefined;
  const search = url.searchParams.get("q") ?? undefined;
  const items = await listItems({ status, search });
  return NextResponse.json({ items });
}

import { NextResponse } from "next/server";
import { listIntegrations } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const integrations = await listIntegrations();
  return NextResponse.json({ integrations });
}

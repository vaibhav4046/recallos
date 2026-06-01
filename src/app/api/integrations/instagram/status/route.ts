import { NextResponse } from "next/server";
import { isInstagramEnabled, getInstagramConnection } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Non-secret status for the UI. Never returns the access token.
export async function GET() {
  const conn = await getInstagramConnection();
  return NextResponse.json({
    configured: isInstagramEnabled(),
    connected: !!conn,
    username: conn?.username ?? null,
    mediaCount: conn?.mediaCount ?? 0,
  });
}

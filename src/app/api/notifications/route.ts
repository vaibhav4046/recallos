import { NextResponse } from "next/server";
import { buildPendingSummary, formatPendingMessage, hasNotifiableActivity } from "@/lib/notifications";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// What the user has waiting — drives the in-app bell, on-device notification,
// and (when enabled) the daily push/email digest.
export async function GET(req: Request) {
  const blocked = await enforce(req, { name: "notifications", limit: 60, windowMs: 60_000 });
  if (blocked) return blocked;
  const summary = await buildPendingSummary();
  const message = formatPendingMessage(summary);
  return NextResponse.json({
    ...summary,
    notifiable: hasNotifiableActivity(summary),
    message,
  });
}

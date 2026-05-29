import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { getDemoUser } from "@/lib/prisma";
import {
  buildPendingSummary,
  formatPendingMessage,
  hasNotifiableActivity,
} from "@/lib/notifications";
import { broadcastPush, isPushEnabled } from "@/lib/push";
import { sendEmail, isEmailEnabled } from "@/lib/email";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Daily digest trigger. Hit by the scheduled job (cron). Protected by
// NOTIFY_SECRET so it can't be fired by randoms. Sends device push + email when
// those channels are configured; otherwise reports what it *would* send.
function authorized(req: Request): boolean {
  const secret = process.env.NOTIFY_SECRET;
  if (!secret) return false; // locked by default
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const user = await getDemoUser();
  const summary = await buildPendingSummary(user.id);
  const message = formatPendingMessage(summary);

  if (!hasNotifiableActivity(summary)) {
    return NextResponse.json({ skipped: "nothing_pending", summary });
  }

  const url = summary.forgottenGems > 0 ? "/inbox" : "/ready-to-build";
  const pushed = await broadcastPush(user.id, { ...message, url });
  const emailHtml = `<h2>${message.title}</h2><p>${message.body}</p>` +
    (summary.topPending.length
      ? `<ul>${summary.topPending.map((p) => `<li>${p.title}</li>`).join("")}</ul>`
      : "") +
    `<p><a href="https://recallos-vaibhav4046s-projects.vercel.app${url}">Open Musemint</a></p>`;
  const emailed = await sendEmail({
    subject: `Musemint · ${message.title}`,
    html: emailHtml,
    text: `${message.title}\n${message.body}`,
  });

  return NextResponse.json({
    summary,
    message,
    channels: { pushEnabled: isPushEnabled(), emailEnabled: isEmailEnabled() },
    delivered: { pushed, emailed },
  });
}

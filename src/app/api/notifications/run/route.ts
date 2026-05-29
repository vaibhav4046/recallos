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
import { escapeHtml } from "@/lib/html";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://recallos-vaibhav4046s-projects.vercel.app");

function safeEqual(token: string, secret: string): boolean {
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Daily digest trigger. Hit by the scheduled job (Vercel cron). Protected by a
// bearer secret — accepts NOTIFY_SECRET (custom cron) or CRON_SECRET (Vercel),
// so it can't be fired by randoms. Sends device push + email when those
// channels are configured; otherwise reports what it *would* send.
function authorized(req: Request): boolean {
  const secrets = [process.env.NOTIFY_SECRET, process.env.CRON_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  if (!secrets.length) return false; // locked by default
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  return secrets.some((s) => safeEqual(token, s));
}

async function runDigest(req: Request) {
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
  const emailHtml =
    `<h2>${escapeHtml(message.title)}</h2><p>${escapeHtml(message.body)}</p>` +
    (summary.topPending.length
      ? `<ul>${summary.topPending.map((p) => `<li>${escapeHtml(p.title)}</li>`).join("")}</ul>`
      : "") +
    `<p><a href="${APP_URL}${url}">Open Musemint</a></p>`;
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

// Vercel Cron invokes via GET (with Authorization: Bearer CRON_SECRET); manual
// triggers may use POST. Both paths require the bearer secret.
export const GET = runDigest;
export const POST = runDigest;

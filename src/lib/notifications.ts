import { prisma, getDemoUser } from "./prisma";

/**
 * Notification content engine.
 *
 * Computes the "you saved this / N pending / forgotten gems" summary that drives
 * in-app, on-device (web push), and email alerts. The DB read lives in
 * buildPendingSummary; the user-facing copy lives in formatPendingMessage so it
 * can be unit-tested without a database.
 */

export interface PendingSummary {
  savedToday: number;
  pending: number; // unprocessed / still in the inbox
  forgottenGems: number; // inbox items older than the stale threshold
  readyToBuild: number;
  topPending: { id: string; title: string }[];
}

const STALE_DAYS = 5;
const STALE_MS = STALE_DAYS * 86_400_000;

export async function buildPendingSummary(userId?: string): Promise<PendingSummary> {
  const uid = userId ?? (await getDemoUser()).id;
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const staleBefore = new Date(Date.now() - STALE_MS);

  const [savedToday, pending, forgottenGems, readyToBuild, topRows] = await Promise.all([
    prisma.capturedItem.count({ where: { userId: uid, createdAt: { gte: startOfToday } } }),
    prisma.capturedItem.count({ where: { userId: uid, status: "inbox" } }),
    prisma.capturedItem.count({
      where: { userId: uid, status: "inbox", createdAt: { lt: staleBefore } },
    }),
    prisma.projectIdea.count({ where: { userId: uid } }),
    prisma.capturedItem.findMany({
      where: { userId: uid, status: "inbox" },
      orderBy: { createdAt: "asc" }, // oldest first — the most "forgotten"
      take: 5,
      select: { id: true, title: true },
    }),
  ]);

  return {
    savedToday,
    pending,
    forgottenGems,
    readyToBuild,
    topPending: topRows.map((r) => ({ id: r.id, title: r.title })),
  };
}

/** Whether there's anything worth notifying about. */
export function hasNotifiableActivity(s: PendingSummary): boolean {
  return s.pending > 0 || s.forgottenGems > 0 || s.readyToBuild > 0;
}

/** Short title + body for an on-device / email notification. Pure + testable. */
export function formatPendingMessage(s: PendingSummary): { title: string; body: string } {
  if (!hasNotifiableActivity(s)) {
    return {
      title: "Musemint",
      body: "Memory's clear — nothing pending. Save something worth building.",
    };
  }

  const title =
    s.forgottenGems > 0
      ? `${s.forgottenGems} forgotten gem${s.forgottenGems === 1 ? "" : "s"} waiting`
      : `${s.pending} saved idea${s.pending === 1 ? "" : "s"} to review`;

  const parts: string[] = [];
  if (s.pending > 0) parts.push(`${s.pending} pending`);
  if (s.forgottenGems > 0) parts.push(`${s.forgottenGems} older than ${STALE_DAYS} days`);
  if (s.readyToBuild > 0) parts.push(`${s.readyToBuild} ready to build`);

  let body = parts.join(" · ");
  const lead = s.topPending[0]?.title?.trim();
  if (lead) body += ` — e.g. "${lead.slice(0, 80)}"`;

  return { title, body };
}

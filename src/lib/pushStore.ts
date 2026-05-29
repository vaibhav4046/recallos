/**
 * Web Push subscription registry — Postgres-backed (Prisma).
 *
 * Persisted so subscriptions survive serverless cold starts and are shared
 * across lambda instances (the daily cron runs in a different instance than the
 * one that handled /api/push/subscribe). Keyed by endpoint; scoped to a user.
 *
 * Requires the PushSubscription table (run `prisma db push` / migrate when
 * enabling push). Dormant until VAPID keys are set, so a missing table never
 * affects the no-key build.
 */
import { prisma } from "./prisma";

export interface StoredPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string;
}

export async function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string;
}): Promise<void> {
  await prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { p256dh: sub.keys.p256dh, auth: sub.keys.auth, userId: sub.userId },
    create: {
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
      userId: sub.userId,
    },
  });
}

export async function listSubscriptions(userId: string): Promise<StoredPushSubscription[]> {
  const rows = await prisma.pushSubscription.findMany({ where: { userId } });
  return rows.map((r) => ({
    endpoint: r.endpoint,
    keys: { p256dh: r.p256dh, auth: r.auth },
    userId: r.userId,
  }));
}

/** Delete by endpoint. Idempotent — no throw when the row is already gone. */
export async function removeSubscription(endpoint: string): Promise<void> {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

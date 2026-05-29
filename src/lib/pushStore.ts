/**
 * Web Push subscription registry.
 *
 * v0: in-memory (per warm serverless instance), mirroring mobileDeviceStore.
 * Fine for the single-user demo; production multi-device push needs a
 * DB-backed table so subscriptions survive cold starts. That migration is part
 * of enabling push (gated), not this dormant scaffolding.
 */

export interface StoredPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string;
  createdAt: string;
}

const subs = new Map<string, StoredPushSubscription>();

export function saveSubscription(sub: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userId: string;
}): StoredPushSubscription {
  const record: StoredPushSubscription = {
    endpoint: sub.endpoint,
    keys: sub.keys,
    userId: sub.userId,
    createdAt: new Date().toISOString(),
  };
  subs.set(sub.endpoint, record);
  return record;
}

export function listSubscriptions(userId: string): StoredPushSubscription[] {
  return Array.from(subs.values()).filter((s) => s.userId === userId);
}

export function removeSubscription(endpoint: string): boolean {
  return subs.delete(endpoint);
}

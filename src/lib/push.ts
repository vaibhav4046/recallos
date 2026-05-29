import webpush from "web-push";
import { listSubscriptions, removeSubscription } from "./pushStore";

/**
 * Web Push sender. Entirely dormant until VAPID keys are configured in the
 * environment, so shipping this changes no behavior. Generate a keypair with
 * `npx web-push generate-vapid-keys` and set:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (mailto:you@example.com)
 */

let configured = false;

export function isPushEnabled(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getVapidPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY ?? null;
}

function ensureConfigured() {
  if (configured || !isPushEnabled()) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:notifications@musemint.app",
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

/** Push to every subscription for a user. No-op (returns 0) when disabled. */
export async function broadcastPush(userId: string, payload: PushPayload): Promise<number> {
  if (!isPushEnabled()) return 0;
  ensureConfigured();
  const subs = await listSubscriptions(userId);
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: s.keys },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err: unknown) {
        // 404/410 → subscription is dead; drop it so we stop retrying.
        const code = (err as { statusCode?: number })?.statusCode;
        if (code === 404 || code === 410) await removeSubscription(s.endpoint);
      }
    }),
  );
  return sent;
}

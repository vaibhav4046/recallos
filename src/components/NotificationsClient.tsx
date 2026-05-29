"use client";
import { useCallback, useEffect, useState } from "react";
import { Bell } from "lucide-react";

const LAST_KEY = "musemint:lastLocalNotif";

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

/**
 * Drives on-device notifications with zero server keys:
 * - If permission is already granted, shows a once-per-day local notification
 *   summarizing what's pending / forgotten (via the service worker).
 * - Offers an opt-in button that requests permission, subscribes to Web Push
 *   when the server has VAPID configured, and fires an immediate alert so the
 *   user sees it work right away.
 */
export function NotificationsClient() {
  const [mounted, setMounted] = useState(false);
  const [perm, setPerm] = useState<NotificationPermission>("default");
  const [busy, setBusy] = useState(false);

  const supported =
    mounted && typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator;

  const showDailyLocal = useCallback(async (force = false) => {
    try {
      const today = new Date().toDateString();
      if (!force && localStorage.getItem(LAST_KEY) === today) return;
      const res = await fetch("/api/notifications");
      const j = await res.json();
      if (!j?.notifiable) return;
      const reg = await navigator.serviceWorker.ready;
      await reg.showNotification(j.message.title, {
        body: j.message.body,
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: "musemint-digest",
        data: { url: j.forgottenGems > 0 ? "/inbox" : "/ready-to-build" },
      });
      localStorage.setItem(LAST_KEY, today);
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!supported) return;
    setPerm(Notification.permission);
    if (Notification.permission === "granted") void showDailyLocal();
  }, [supported, showDailyLocal]);

  const enable = useCallback(async () => {
    if (!supported || busy) return;
    setBusy(true);
    try {
      const p = await Notification.requestPermission();
      setPerm(p);
      if (p !== "granted") return;
      // Subscribe to Web Push only if the server advertises a VAPID key.
      try {
        const cfg = await fetch("/api/push/subscribe").then((r) => r.json());
        if (cfg?.enabled && cfg?.publicKey) {
          const reg = await navigator.serviceWorker.ready;
          const existing = await reg.pushManager.getSubscription();
          const sub =
            existing ||
            (await reg.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: urlBase64ToUint8Array(cfg.publicKey) as BufferSource,
            }));
          await fetch("/api/push/subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(sub),
          });
        }
      } catch {
        /* push optional — local notifications still work */
      }
      await showDailyLocal(true);
    } finally {
      setBusy(false);
    }
  }, [supported, busy, showDailyLocal]);

  if (!supported || perm === "granted" || perm === "denied") return null;

  return (
    <button
      type="button"
      onClick={enable}
      disabled={busy}
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-bg-panel/90 px-4 py-2 text-sm text-ink shadow-lg backdrop-blur-md transition-colors hover:border-accent/70 disabled:opacity-60"
      aria-label="Enable notifications"
    >
      <Bell className="h-4 w-4 text-accent" />
      <span>{busy ? "Enabling…" : "Enable alerts"}</span>
    </button>
  );
}

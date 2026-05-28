# Musemint Mobile Companion — Architecture & Sync Plan

Status: planning. The web app (Next.js) is the source of truth. The mobile
companion is an Expo React Native app that lets the user capture from anywhere,
get push reminders, and review/triage on the go.

## Goals

1. Frictionless capture from the iOS/Android system share sheet (URLs, text,
   screenshots) without opening the full app.
2. Reliable sync to the same backend the web app uses — no second database.
3. Push notifications for daily digest, due reminders, and "forgotten gem"
   nudges.
4. Works offline; queued captures sync when the device is online again.

## Stack

- **Expo SDK 51** managed workflow — fast iteration, OTA updates via EAS.
- **React Native + TypeScript** — share UI primitives with the web client via a
  thin `@musemint/shared` workspace package (zod schemas, scoring utilities).
- **Expo Router** — file-based routing mirroring the web app's mental model.
- **expo-share-intent** / `react-native-share-menu` — register a share extension
  so the OS share sheet shows "Save to Musemint."
- **expo-notifications** — APNs/FCM token registration and local notifications.
- **expo-secure-store** — store the user's auth token + offline queue cursor.
- **MMKV** (`react-native-mmkv`) — fast local KV store for the offline outbox.

## Backend contract

The mobile app talks to the same Next.js API the web app uses. New routes:

| Route                                | Method | Purpose                                    |
| ------------------------------------ | ------ | ------------------------------------------ |
| `POST /api/mobile/devices`           | POST   | Register a device (platform, model, app v) |
| `DELETE /api/mobile/devices/:id`     | DELETE | Unregister on logout                       |
| `POST /api/mobile/push-token`        | POST   | Upsert APNs/FCM token for the device       |
| `POST /api/capture`                  | POST   | Existing — already accepts mobile payloads |
| `GET  /api/items?status=…&since=…`   | GET    | Cursor-style pull sync for triage view     |

`POST /api/capture` already validates input via the shared `CaptureSchema`,
which means the mobile share extension just needs to POST the same JSON it
would from the web (`{ kind, url?, rawContent?, imageData?, intent }`).

## Share-to-Musemint flow

1. User shares a link/screenshot to the Musemint share extension.
2. Extension reads the payload (URL, text, image URI) and writes a minimal
   `{kind, url, imageData?}` record to the outbox (MMKV) along with a
   `clientId` (UUID v4) for idempotency.
3. A foreground/background task POSTs `/api/capture` with the record. On 2xx
   the outbox row is deleted; on retryable failures (network/5xx) it stays
   queued with exponential backoff.
4. The app shows a non-intrusive toast: "Saved to Musemint" with a deep link
   into `musemint://inbox?focus=<id>` once the server returns the new id.

## Push token registration

1. On first launch, the app calls `Notifications.requestPermissionsAsync()`.
2. On grant, it fetches the `ExpoPushToken` and the underlying APNs/FCM token.
3. App posts to `POST /api/mobile/devices` with `{ platform, model, appVersion,
   osVersion }` → server returns a `deviceId`.
4. App then posts to `POST /api/mobile/push-token` with `{ deviceId, token,
   provider: "expo" | "apns" | "fcm" }`.
5. Server side: tokens are stored against the user (multi-device fine). A
   future `lib/push.ts` will fan out digest / reminder notifications via Expo's
   push API.

## Offline queue

- All write actions (capture, keep/archive, reminder snooze) are wrapped in a
  `mutate()` helper that:
  1. Writes the intent + clientId to the outbox.
  2. Updates local optimistic state.
  3. Attempts the network call.
- A foreground `NetInfo` listener drains the outbox FIFO when connectivity
  returns. Each entry carries `attempts` and `nextAttemptAt` for backoff.
- Idempotency: server-side handlers should accept an optional `clientId` and
  return the existing record when one already exists for that `(userId,
  clientId)` pair. (This isn't implemented server-side yet — see "Open work"
  below.)

## Pull sync / triage

The triage view pulls `/api/items?status=inbox&since=<lastSyncAt>` on focus.
Server returns at most 200 items; client merges by id and updates the local
cache. There's no need for full WebSocket sync at this size — pull on focus +
push on reminder is enough.

## Auth

Phase 1: single-user app behind a long-lived bearer token entered once in
settings (matches the current local-first posture).
Phase 2: device-bound JWT issued from `/api/login` with refresh.

## Open work to ship a v1

- Add `clientId` column to `CapturedItem` and dedupe on insert.
- Implement `lib/push.ts` and wire daily-digest / reminder triggers.
- Expo project scaffold under `apps/mobile` (workspace package).
- Configure EAS build profiles for TestFlight + Play internal testing.
- Resize/compress shared screenshots client-side before upload (max 1600px).

## Telemetry

- Capture latency (share-tap to server 2xx) — p50/p95.
- Outbox depth at app suspend (should hover near 0).
- Push deliverability per provider.

## Risks

- iOS share extensions are sandboxed and have a 120 MB memory ceiling — keep
  the share UI minimal and defer heavy work to the main app process.
- APNs token rotation: the app must re-register on every token change event.
- Apple App Store review for AI features — keep mock fallback so reviewers
  can exercise the app without keys.

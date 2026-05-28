/**
 * Mobile device + push-token registry. v0 stub: in-memory only.
 *
 * Lives outside the Prisma schema so this scaffolding doesn't require a
 * migration. Once the mobile client lands we'll persist these to a real
 * `Device` / `PushToken` table.
 */

import { randomUUID } from "node:crypto";

export interface MobileDevice {
  id: string;
  userId: string;
  platform: "ios" | "android";
  model?: string | null;
  appVersion?: string | null;
  osVersion?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MobilePushToken {
  deviceId: string;
  userId: string;
  token: string;
  provider: "expo" | "apns" | "fcm";
  updatedAt: string;
}

const devices = new Map<string, MobileDevice>();
const tokens = new Map<string, MobilePushToken>();

export function registerDevice(args: {
  userId: string;
  platform: "ios" | "android";
  model?: string;
  appVersion?: string;
  osVersion?: string;
}): MobileDevice {
  const id = randomUUID();
  const now = new Date().toISOString();
  const device: MobileDevice = {
    id,
    userId: args.userId,
    platform: args.platform,
    model: args.model ?? null,
    appVersion: args.appVersion ?? null,
    osVersion: args.osVersion ?? null,
    createdAt: now,
    updatedAt: now,
  };
  devices.set(id, device);
  return device;
}

export function listDevices(userId: string): MobileDevice[] {
  return Array.from(devices.values()).filter((d) => d.userId === userId);
}

export function removeDevice(deviceId: string, userId: string): boolean {
  const d = devices.get(deviceId);
  if (!d || d.userId !== userId) return false;
  devices.delete(deviceId);
  tokens.delete(deviceId);
  return true;
}

export function upsertPushToken(args: {
  deviceId: string;
  userId: string;
  token: string;
  provider: "expo" | "apns" | "fcm";
}): MobilePushToken | null {
  const device = devices.get(args.deviceId);
  if (!device || device.userId !== args.userId) return null;
  const record: MobilePushToken = {
    deviceId: args.deviceId,
    userId: args.userId,
    token: args.token,
    provider: args.provider,
    updatedAt: new Date().toISOString(),
  };
  tokens.set(args.deviceId, record);
  return record;
}

export function getPushToken(deviceId: string): MobilePushToken | null {
  return tokens.get(deviceId) ?? null;
}

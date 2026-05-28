import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { getDemoUser } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";
import { upsertPushToken } from "@/lib/mobileDeviceStore";

const TokenSchema = z.object({
  deviceId: z.string().min(1).max(64),
  token: z.string().min(8).max(512),
  provider: z.enum(["expo", "apns", "fcm"]),
});

export const POST = handle(async (req) => {
  const blocked = await enforce(req, { name: "mobile-push-token", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = TokenSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const user = await getDemoUser();
  const record = upsertPushToken({ userId: user.id, ...parsed.data });
  if (!record) {
    return NextResponse.json({ error: "device_not_registered" }, { status: 404 });
  }
  // Never echo the token back — store-only side-effect.
  return NextResponse.json({
    deviceId: record.deviceId,
    provider: record.provider,
    updatedAt: record.updatedAt,
  });
});

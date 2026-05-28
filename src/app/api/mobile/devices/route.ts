import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { getDemoUser } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";
import { listDevices, registerDevice } from "@/lib/mobileDeviceStore";

const RegisterSchema = z.object({
  platform: z.enum(["ios", "android"]),
  model: z.string().max(120).optional(),
  appVersion: z.string().max(40).optional(),
  osVersion: z.string().max(40).optional(),
});

export const GET = handle(async () => {
  const user = await getDemoUser();
  return NextResponse.json({ devices: listDevices(user.id) });
});

export const POST = handle(async (req) => {
  const blocked = await enforce(req, { name: "mobile-register", limit: 10, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const user = await getDemoUser();
  const device = registerDevice({ userId: user.id, ...parsed.data });
  return NextResponse.json({ device });
});

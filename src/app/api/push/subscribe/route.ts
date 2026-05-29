import { NextResponse } from "next/server";
import { z } from "zod";
import { handle } from "@/lib/api";
import { getDemoUser } from "@/lib/prisma";
import { enforce } from "@/lib/ratelimit";
import { isPushEnabled, getVapidPublicKey } from "@/lib/push";
import { saveSubscription } from "@/lib/pushStore";

// Client reads this to decide whether to offer push + which VAPID key to use.
export async function GET() {
  return NextResponse.json({ enabled: isPushEnabled(), publicKey: getVapidPublicKey() });
}

const SubSchema = z.object({
  endpoint: z.string().url().max(1000),
  keys: z.object({
    p256dh: z.string().min(1).max(400),
    auth: z.string().min(1).max(400),
  }),
});

export const POST = handle(async (req) => {
  const blocked = await enforce(req, { name: "push-subscribe", limit: 20, windowMs: 60_000 });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = SubSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input", issues: parsed.error.flatten() }, { status: 400 });
  }
  const user = await getDemoUser();
  await saveSubscription({ ...parsed.data, userId: user.id });
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { CaptureSchema, createCapture } from "@/lib/capture";
import { enforce } from "@/lib/ratelimit";
import { handle } from "@/lib/api";

export const POST = handle(async (req) => {
  const blocked = await enforce(req, { name: "capture", limit: 40, windowMs: 60_000, ai: true });
  if (blocked) return blocked;
  const body = await req.json().catch(() => null);
  const parsed = CaptureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_input", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const item = await createCapture(parsed.data);
  return NextResponse.json({ item });
});

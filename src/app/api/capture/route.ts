import { NextResponse } from "next/server";
import { CaptureSchema, createCapture } from "@/lib/capture";

export async function POST(req: Request) {
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
}

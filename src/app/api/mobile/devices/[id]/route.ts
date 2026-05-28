import { NextResponse } from "next/server";
import { handle } from "@/lib/api";
import { getDemoUser } from "@/lib/prisma";
import { removeDevice } from "@/lib/mobileDeviceStore";

export const DELETE = handle(async (_req, { params }) => {
  const user = await getDemoUser();
  const ok = removeDevice(params.id, user.id);
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
});

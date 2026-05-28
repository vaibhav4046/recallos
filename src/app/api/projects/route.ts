import { NextResponse } from "next/server";
import { listProjects } from "@/lib/queries";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const projects = await listProjects();
  return NextResponse.json({ projects });
}

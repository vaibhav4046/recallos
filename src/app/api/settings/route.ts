import { NextResponse } from "next/server";
import { activeProviderName } from "@/lib/ai/provider";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const keys = [
    { provider: "gemini", configured: !!process.env.GOOGLE_API_KEY },
    { provider: "openai", configured: !!process.env.OPENAI_API_KEY },
    { provider: "anthropic", configured: !!process.env.ANTHROPIC_API_KEY },
    { provider: "groq", configured: !!process.env.GROQ_API_KEY },
    { provider: "mistral", configured: !!process.env.MISTRAL_API_KEY },
    { provider: "youtube", configured: !!process.env.YOUTUBE_API_KEY },
  ];
  return NextResponse.json({ keys, active: activeProviderName() });
}

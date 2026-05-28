import { NextResponse } from "next/server";
import { handleMcp, mcpManifest, type JsonRpcRequest } from "@/lib/mcp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(mcpManifest());
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }

  // Support batched requests per JSON-RPC 2.0 spec.
  if (Array.isArray(body)) {
    const responses = await Promise.all(body.map((r) => handleMcp(r as JsonRpcRequest)));
    return NextResponse.json(responses);
  }
  const response = await handleMcp(body as JsonRpcRequest);
  return NextResponse.json(response);
}

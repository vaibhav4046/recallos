import { NextResponse } from "next/server";
import {
  handleMcp,
  mcpManifest,
  isAuthorized,
  MCP_MAX_BATCH,
  type JsonRpcRequest,
} from "@/lib/mcp";
import { enforce } from "@/lib/ratelimit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  return NextResponse.json(mcpManifest());
}

export async function POST(req: Request) {
  const blocked = await enforce(req, { name: "mcp", limit: 60, windowMs: 60_000 });
  if (blocked) return blocked;

  const authed = isAuthorized(req.headers.get("authorization"));
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json(
      { jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } },
      { status: 400 },
    );
  }

  // Support batched requests per JSON-RPC 2.0 spec, with a hard size cap.
  if (Array.isArray(body)) {
    if (body.length === 0 || body.length > MCP_MAX_BATCH) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          id: null,
          error: { code: -32600, message: `Batch must be 1–${MCP_MAX_BATCH} requests` },
        },
        { status: 400 },
      );
    }
    const responses = await Promise.all(
      body.map((r) => handleMcp(r as JsonRpcRequest, { authed })),
    );
    return NextResponse.json(responses);
  }
  const response = await handleMcp(body as JsonRpcRequest, { authed });
  return NextResponse.json(response);
}

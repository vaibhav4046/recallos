import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Map any thrown error to a sanitized JSON response. Never leaks stack traces
 * or internal messages to the client — details are logged server-side only.
 */
export function apiError(e: unknown): NextResponse {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    if (e.code === "P2025") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (e.code === "P2002") {
      return NextResponse.json({ error: "conflict" }, { status: 409 });
    }
  }
  if (e instanceof Prisma.PrismaClientValidationError) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }
  console.error("[api] unhandled error:", e);
  return NextResponse.json({ error: "internal_error" }, { status: 500 });
}

type RouteCtx = { params: Record<string, string> };
type Handler = (req: Request, ctx: RouteCtx) => Promise<Response> | Response;

/**
 * Wrap a route handler so any thrown error becomes a sanitized response.
 * Usage: `export const POST = handle(async (req, { params }) => { ... });`
 */
export function handle(fn: Handler): Handler {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx ?? ({ params: {} } as RouteCtx));
    } catch (e) {
      return apiError(e);
    }
  };
}

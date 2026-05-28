// Hand-rolled MCP-style JSON-RPC 2.0 over HTTP.
// Spec: https://modelcontextprotocol.io
// Supports: initialize, tools/list, tools/call.
// Tools: recallos.capture, recallos.search, recallos.list_projects, recallos.generate_build_pack.

import { z } from "zod";
import { createCapture, CaptureSchema } from "./capture";
import { listItems, listProjects } from "./queries";
import { prisma } from "./prisma";
import { generateBuildPack, packToMarkdown } from "./ai/generateBuildPack";
import { parseJson } from "./utils";

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: string | number | null;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: any;
  error?: { code: number; message: string; data?: any };
}

const TOOLS = [
  {
    name: "recallos_capture",
    description:
      "Save content to RecallOS memory. Accepts URL, note, or prompt. Auto-classifies, scores, and stores. Returns the saved item.",
    inputSchema: {
      type: "object",
      required: ["kind"],
      properties: {
        kind: {
          type: "string",
          enum: ["url", "note", "prompt", "youtube", "linkedin", "instagram", "github", "article", "text"],
        },
        url: { type: "string", description: "URL when kind is url/youtube/etc." },
        title: { type: "string" },
        rawContent: { type: "string" },
        intent: {
          type: "string",
          enum: ["remember", "project", "prompt", "learn", "jobsearch", "reminder", "summarize", "auto"],
          default: "auto",
        },
      },
    },
  },
  {
    name: "recallos_search",
    description:
      "Keyword search across saved memory (title, summary, tags, category, platform). Returns top items.",
    inputSchema: {
      type: "object",
      required: ["query"],
      properties: {
        query: { type: "string" },
        limit: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "recallos_list_projects",
    description: "List buildable project ideas with portfolio value and tech stack.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "recallos_generate_build_pack",
    description:
      "Generate a full implementation pack (problem statement, user stories, features, architecture, API plan, schema, tasks, README) for a project idea. Returns markdown.",
    inputSchema: {
      type: "object",
      required: ["projectId"],
      properties: { projectId: { type: "string" } },
    },
  },
];

const SERVER_INFO = {
  name: "recallos",
  version: "0.1.0",
  description:
    "RecallOS — turn saved web content into builder-ready project briefs. Stop saving. Start building.",
};

function ok(id: JsonRpcRequest["id"], result: any): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, result };
}
function err(id: JsonRpcRequest["id"], code: number, message: string): JsonRpcResponse {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

const CaptureToolSchema = CaptureSchema;
const SearchToolSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().min(1).max(50).default(10),
});
const BuildPackToolSchema = z.object({
  projectId: z.string().min(1),
});

async function handleToolCall(name: string, args: any) {
  if (name === "recallos_capture") {
    const parsed = CaptureToolSchema.parse(args);
    const item = await createCapture(parsed);
    const tags = parseJson<string[]>(item.tagsJson, []);
    const scores = parseJson<Record<string, number>>(item.scoresJson, {});
    return {
      content: [
        {
          type: "text",
          text: `Captured: ${item.title}\nCategory: ${item.category}\nTags: ${tags.join(", ")}\nUsefulness ${scores.usefulness ?? 0} · Actionable ${scores.actionability ?? 0} · Portfolio ${scores.portfolioValue ?? 0}\nNext: ${item.nextAction ?? ""}`,
        },
      ],
      isError: false,
    };
  }
  if (name === "recallos_search") {
    const parsed = SearchToolSchema.parse(args);
    const items = await listItems({ search: parsed.query, limit: parsed.limit });
    const lines = items.map(
      (i) =>
        `- [${i.sourcePlatform}] ${i.title}${i.category ? ` (${i.category})` : ""}\n  ${i.summary ?? ""}`,
    );
    return {
      content: [
        {
          type: "text",
          text:
            items.length === 0
              ? `No matches for "${parsed.query}".`
              : `Found ${items.length} matches:\n${lines.join("\n")}`,
        },
      ],
      isError: false,
    };
  }
  if (name === "recallos_list_projects") {
    const projects = await listProjects();
    const lines = projects.map(
      (p) =>
        `- ${p.title} (portfolio ${p.portfolioValue}, github ${p.githubScore}, ${p.difficulty}, ${p.estBuildTime}) — ${p.whyItMatters}\n  id: ${p.id}\n  stack: ${p.techStack.join(", ")}`,
    );
    return {
      content: [
        {
          type: "text",
          text:
            projects.length === 0
              ? "No project ideas yet."
              : `${projects.length} buildable ideas:\n${lines.join("\n\n")}`,
        },
      ],
      isError: false,
    };
  }
  if (name === "recallos_generate_build_pack") {
    const parsed = BuildPackToolSchema.parse(args);
    const project = await prisma.projectIdea.findUnique({ where: { id: parsed.projectId } });
    if (!project) return { content: [{ type: "text", text: "Project not found." }], isError: true };
    const techStack = parseJson<string[]>(project.techStackJson, []);
    const sourceIds = parseJson<string[]>(project.sourceItemsJson, []);
    const sourceItems = sourceIds.length
      ? await prisma.capturedItem.findMany({ where: { id: { in: sourceIds } } })
      : [];
    const { pack } = await generateBuildPack({
      projectTitle: project.title,
      whyItMatters: project.whyItMatters,
      difficulty: project.difficulty,
      techStack,
      sourceItems: sourceItems.map((s) => ({ title: s.title, summary: s.summary, url: s.url })),
    });
    return {
      content: [{ type: "text", text: packToMarkdown(project.title, pack) }],
      isError: false,
    };
  }
  return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
}

export async function handleMcp(req: JsonRpcRequest): Promise<JsonRpcResponse> {
  if (req.jsonrpc !== "2.0") return err(req.id, -32600, "Invalid request");
  try {
    if (req.method === "initialize") {
      return ok(req.id, {
        protocolVersion: "2024-11-05",
        capabilities: { tools: {} },
        serverInfo: SERVER_INFO,
      });
    }
    if (req.method === "ping") {
      return ok(req.id, {});
    }
    if (req.method === "tools/list") {
      return ok(req.id, { tools: TOOLS });
    }
    if (req.method === "tools/call") {
      const name = req.params?.name as string;
      const args = req.params?.arguments ?? {};
      if (!name) return err(req.id, -32602, "Missing tool name");
      try {
        const result = await handleToolCall(name, args);
        return ok(req.id, result);
      } catch (toolErr: any) {
        return ok(req.id, {
          content: [{ type: "text", text: `Tool error: ${toolErr.message ?? String(toolErr)}` }],
          isError: true,
        });
      }
    }
    return err(req.id, -32601, `Method not found: ${req.method}`);
  } catch (e: any) {
    return err(req.id, -32603, e?.message ?? "Internal error");
  }
}

export function mcpManifest() {
  return {
    name: SERVER_INFO.name,
    version: SERVER_INFO.version,
    description: SERVER_INFO.description,
    transport: "http",
    endpoint: "/api/mcp",
    tools: TOOLS.map((t) => ({ name: t.name, description: t.description })),
  };
}

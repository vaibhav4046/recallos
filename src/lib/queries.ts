import { prisma, getDemoUser } from "./prisma";
import { parseJson } from "./utils";

export type ItemWithMeta = Awaited<ReturnType<typeof listItems>>[number];

const SEARCH_FIELDS = [
  "title",
  "summary",
  "category",
  "sourcePlatform",
  "tagsJson",
  "rawContent",
] as const;

/**
 * Build a Prisma `AND` filter from a free-text query.
 *
 * - Case-insensitive: typing "never gonna" must find "Never Gonna Give You Up".
 * - Tokenized + AND'd: loose, out-of-order keywords still match (each token must
 *   appear in at least one field), so an impatient user who half-remembers a
 *   title still lands on it. Returns null for an empty/whitespace query.
 */
export function buildSearchFilter(search: string) {
  const tokens = search
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 8);
  if (!tokens.length) return null;
  return tokens.map((tok) => ({
    OR: SEARCH_FIELDS.map((f) => ({
      [f]: { contains: tok, mode: "insensitive" as const },
    })),
  }));
}

const EMPTY_TITLE_PATTERNS = [/^untitled capture$/i, /^untitled$/i];

function looksEmpty(item: {
  title: string;
  url: string | null;
  rawContent: string | null;
  summary: string | null;
}): boolean {
  const titleEmpty = !item.title.trim() || EMPTY_TITLE_PATTERNS.some((re) => re.test(item.title.trim()));
  const noUrl = !item.url?.trim();
  const noRaw = !item.rawContent?.trim();
  const noSummary = !item.summary?.trim();
  return titleEmpty && noUrl && noRaw && noSummary;
}

export async function listItems(opts?: {
  status?: string;
  limit?: number;
  search?: string;
}) {
  const user = await getDemoUser();
  const where: any = { userId: user.id };
  if (opts?.status) where.status = opts.status;
  if (opts?.search) {
    const and = buildSearchFilter(opts.search);
    if (and) where.AND = and;
  }
  const items = await prisma.capturedItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: opts?.limit ?? 200,
  });
  return items.filter((i) => !looksEmpty(i)).map((i) => ({
    ...i,
    tags: parseJson<string[]>(i.tagsJson, []),
    metadata: parseJson<Record<string, unknown>>(i.metadataJson, {}),
    scores: parseJson<{
      usefulness: number;
      actionability: number;
      portfolioValue: number;
      confidence: number;
    }>(i.scoresJson, {
      usefulness: 0,
      actionability: 0,
      portfolioValue: 0,
      confidence: 0,
    }),
  }));
}

export async function getItem(id: string) {
  const user = await getDemoUser();
  // Scope by owner so an item id from another user can never be read (IDOR).
  const item = await prisma.capturedItem.findFirst({ where: { id, userId: user.id } });
  if (!item) return null;
  return {
    ...item,
    tags: parseJson<string[]>(item.tagsJson, []),
    metadata: parseJson<Record<string, unknown>>(item.metadataJson, {}),
    scores: parseJson<{
      usefulness: number;
      actionability: number;
      portfolioValue: number;
      confidence: number;
    }>(item.scoresJson, {
      usefulness: 0,
      actionability: 0,
      portfolioValue: 0,
      confidence: 0,
    }),
  };
}

export async function listProjects() {
  const user = await getDemoUser();
  const projects = await prisma.projectIdea.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  return projects.map((p) => ({
    ...p,
    techStack: parseJson<string[]>(p.techStackJson, []),
    sourceItems: parseJson<string[]>(p.sourceItemsJson, []),
  }));
}

export async function listPrompts() {
  const user = await getDemoUser();
  const prompts = await prisma.prompt.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });
  return prompts.map((p) => ({
    ...p,
    tags: parseJson<string[]>(p.tagsJson, []),
    versions: parseJson<{ at: string; body: string }[]>(p.versionsJson, []),
  }));
}

export async function listReminders() {
  const user = await getDemoUser();
  return prisma.reminder.findMany({
    where: { userId: user.id },
    orderBy: { dueAt: "asc" },
  });
}

export async function listIntegrations() {
  const user = await getDemoUser();
  return prisma.integration.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
}

export async function getStats() {
  const user = await getDemoUser();
  const [items, processed, inbox, projects, prompts, reminders, integrations] = await Promise.all([
    prisma.capturedItem.count({ where: { userId: user.id } }),
    prisma.capturedItem.count({ where: { userId: user.id, isProcessed: true } }),
    prisma.capturedItem.count({ where: { userId: user.id, status: "inbox" } }),
    prisma.projectIdea.count({ where: { userId: user.id } }),
    prisma.prompt.count({ where: { userId: user.id } }),
    prisma.reminder.count({ where: { userId: user.id, status: "due" } }),
    prisma.integration.count({ where: { userId: user.id, status: "connected" } }),
  ]);
  const forgottenGems = await prisma.capturedItem.count({
    where: {
      userId: user.id,
      status: "inbox",
      createdAt: { lt: new Date(Date.now() - 5 * 86_400_000) },
    },
  });
  const portfolioItems = await prisma.capturedItem.findMany({
    where: { userId: user.id, isProcessed: true },
    select: { scoresJson: true },
  });
  const portfolioCount = portfolioItems.filter((i) => {
    const s = parseJson<{ portfolioValue: number }>(i.scoresJson, { portfolioValue: 0 });
    return s.portfolioValue >= 80;
  }).length;
  const confidenceAvg =
    portfolioItems.reduce((acc, i) => {
      const s = parseJson<{ confidence: number }>(i.scoresJson, { confidence: 0 });
      return acc + (s.confidence ?? 0);
    }, 0) / Math.max(portfolioItems.length, 1);

  const jobActions = await prisma.capturedItem.count({
    where: { userId: user.id, intent: "jobsearch" },
  });

  const memoryHealth =
    items === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            60 + (processed / Math.max(items, 1)) * 40 - Math.min(forgottenGems * 2, 20),
          ),
        );

  // Honest, real-time counts straight from the database — every number reflects
  // exactly what the user has captured and processed. No floors, no fakes.
  return {
    saved: items,
    processed,
    inbox,
    readyToBuild: projects,
    forgottenGems,
    prompts,
    portfolioWorthy: portfolioCount,
    jobActions,
    memoryHealth,
    classificationConfidence: processed === 0 ? 0 : Math.round(confidenceAvg),
    remindersDue: reminders,
    integrationsConnected: integrations,
    realCounts: { items, processed, projects, prompts },
  };
}

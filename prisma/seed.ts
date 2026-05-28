import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@recallos.app";

type ItemSeed = {
  kind: string;
  sourcePlatform: string;
  url?: string;
  rawContent?: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  metadata: Record<string, unknown>;
  scores: {
    usefulness: number;
    actionability: number;
    portfolioValue: number;
    confidence: number;
  };
  nextAction: string;
  intent: string;
  status: string;
  isProcessed: boolean;
  daysAgo: number;
};

const ITEMS: ItemSeed[] = [
  {
    kind: "youtube",
    sourcePlatform: "youtube",
    url: "https://www.youtube.com/watch?v=mcp-agent-demo",
    title: "Build an AI Agent with MCP",
    summary:
      "Walkthrough of building a tool-using AI agent on top of the Model Context Protocol — covers server design, schemas, and a working desktop demo.",
    category: "AI Agents",
    tags: ["ai-agents", "mcp", "tool-use", "video"],
    metadata: { channel: "Builders & Bots", durationMin: 38 },
    scores: { usefulness: 92, actionability: 88, portfolioValue: 86, confidence: 94 },
    nextAction: "Spec the agent + draft tool list",
    intent: "project",
    status: "inbox",
    isProcessed: true,
    daysAgo: 0,
  },
  {
    kind: "linkedin",
    sourcePlatform: "linkedin",
    url: "https://www.linkedin.com/posts/recruiter-tips-resume",
    title: "How to write better software engineer resumes",
    summary:
      "Senior recruiter breaks down 7 patterns that get callbacks: outcomes-first bullets, quantified impact, and a 'projects' section above experience.",
    category: "Job Automation",
    tags: ["resume", "career", "job-search"],
    metadata: { author: "L. Patel", postType: "carousel" },
    scores: { usefulness: 84, actionability: 90, portfolioValue: 38, confidence: 92 },
    nextAction: "Rewrite resume bullets using the outcomes-first pattern",
    intent: "jobsearch",
    status: "inbox",
    isProcessed: true,
    daysAgo: 1,
  },
  {
    kind: "instagram",
    sourcePlatform: "instagram",
    url: "https://www.instagram.com/reel/dashboard-ui-clean",
    title: "Clean dashboard UI inspiration",
    summary:
      "A 30-second reel of a graphite-themed analytics dashboard — strong use of glass cards, restrained accent colors, and clear typographic hierarchy.",
    category: "UI Inspiration",
    tags: ["ui", "dashboard", "inspiration", "design"],
    metadata: { author: "@interface_journal", durationSec: 32 },
    scores: { usefulness: 70, actionability: 60, portfolioValue: 64, confidence: 80 },
    nextAction: "Save as reference + sketch a homepage variant",
    intent: "remember",
    status: "inbox",
    isProcessed: true,
    daysAgo: 2,
  },
  {
    kind: "github",
    sourcePlatform: "github",
    url: "https://github.com/example/open-rag-chatbot",
    title: "Open-source RAG chatbot",
    summary:
      "Reference implementation of a retrieval-augmented chatbot with pgvector, LangChain, and streaming responses. MIT licensed, 4.2k stars.",
    category: "Full-stack Projects",
    tags: ["rag", "vector-db", "open-source", "chatbot"],
    metadata: { stars: 4200, language: "TypeScript" },
    scores: { usefulness: 90, actionability: 84, portfolioValue: 92, confidence: 95 },
    nextAction: "Open Build Pack draft",
    intent: "project",
    status: "inbox",
    isProcessed: true,
    daysAgo: 3,
  },
  {
    kind: "article",
    sourcePlatform: "web",
    url: "https://example.com/vector-databases-explained",
    title: "Vector databases explained",
    summary:
      "A primer comparing pgvector, Pinecone, Qdrant, and Chroma — covers indexing strategies, hybrid search, and when each makes sense.",
    category: "Learning Resources",
    tags: ["vector-db", "learning", "rag"],
    metadata: { readMin: 9 },
    scores: { usefulness: 80, actionability: 55, portfolioValue: 60, confidence: 88 },
    nextAction: "Queue for weekend study",
    intent: "learn",
    status: "inbox",
    isProcessed: true,
    daysAgo: 4,
  },
  {
    kind: "prompt",
    sourcePlatform: "prompt",
    rawContent:
      "Write SaaS landing page copy for a [PRODUCT] aimed at [AUDIENCE]. Headline, sub, three benefits, social proof, CTA.",
    title: "Generate SaaS landing page copy",
    summary:
      "Reusable copywriting prompt with structured slots for product, audience, benefits, and CTA — drop-in for any new SaaS landing draft.",
    category: "Prompt Engineering",
    tags: ["prompts", "copywriting", "saas"],
    metadata: { reuseCount: 4 },
    scores: { usefulness: 82, actionability: 78, portfolioValue: 44, confidence: 90 },
    nextAction: "Promote to Prompt Library",
    intent: "prompt",
    status: "inbox",
    isProcessed: true,
    daysAgo: 5,
  },
  {
    kind: "linkedin",
    sourcePlatform: "linkedin",
    url: "https://www.linkedin.com/posts/recruiter-outreach",
    title: "How to message recruiters that actually reply",
    summary:
      "3-line outreach template + 4 anti-patterns to avoid. Reply rate jumped from 8% to 31% across a 200-message test.",
    category: "Job Automation",
    tags: ["recruiter", "outreach", "career"],
    metadata: { author: "M. Chen" },
    scores: { usefulness: 86, actionability: 92, portfolioValue: 30, confidence: 89 },
    nextAction: "Save outreach template to Job Vault",
    intent: "jobsearch",
    status: "inbox",
    isProcessed: true,
    daysAgo: 6,
  },
  {
    kind: "note",
    sourcePlatform: "note",
    rawContent:
      "Idea: AI job application automation agent — scrapes JD, drafts tailored resume + cover, queues outreach. Risk: scraping ToS — use official APIs.",
    title: "AI job application automation agent",
    summary:
      "Personal note sketching an agent that adapts applications per JD, then queues recruiter outreach. Build with Gemini + structured templates.",
    category: "AI Agents",
    tags: ["ai-agents", "job-search", "automation"],
    metadata: {},
    scores: { usefulness: 90, actionability: 86, portfolioValue: 94, confidence: 88 },
    nextAction: "Open Build Pack draft",
    intent: "project",
    status: "inbox",
    isProcessed: true,
    daysAgo: 7,
  },
];

const PROMPTS = [
  {
    title: "Generate SaaS landing page copy",
    body: "Write SaaS landing page copy for a [PRODUCT] aimed at [AUDIENCE]. Output headline, sub, 3 benefits, social proof line, CTA.",
    improved:
      "# Role\nYou are a SaaS copywriter who writes for skeptical engineering buyers.\n\n# Context\nProduct: [PRODUCT]\nAudience: [AUDIENCE]\n\n# Output\n1. Headline (8 words, outcomes-first)\n2. Sub (under 18 words)\n3. Three benefit bullets (verb-led)\n4. Social proof line\n5. CTA (single-action)",
    category: "marketing",
    qualityScore: 88,
    tags: ["saas", "copywriting"],
  },
  {
    title: "Critique my resume bullet",
    body: "Critique this resume bullet for outcomes-first writing. Suggest a rewrite under 20 words.",
    improved:
      "# Role\nYou are a senior FAANG recruiter who reviews resumes for outcomes-first writing.\n\n# Task\nCritique the bullet in 3 specific notes. Then rewrite in <= 20 words: action verb, scope, quantified impact.",
    category: "career",
    qualityScore: 84,
    tags: ["resume", "career"],
  },
  {
    title: "Generate a project README",
    body: "Generate a README.md for a Next.js + Prisma project that does X.",
    improved:
      "# Role\nYou are an open-source maintainer who writes scannable READMEs.\n\n# Context\nProject: [NAME]\nWhat it does: [DESCRIPTION]\nStack: Next.js, Prisma, Tailwind\n\n# Output\nSections: hero, features, screenshots, setup, env vars, scripts, architecture, roadmap, license. Use bullet lists.",
    category: "engineering",
    qualityScore: 86,
    tags: ["readme", "engineering"],
  },
];

const REMINDERS = [
  { title: "Watch saved MCP agent video", kind: "forgotten", inDays: 1 },
  { title: "Sketch RAG chatbot architecture this weekend", kind: "build", inDays: 2 },
  { title: "Send recruiter outreach using new template", kind: "job", inDays: 3 },
  { title: "Review vector DB primer notes", kind: "learn", inDays: 4 },
];

const INTEGRATIONS: { key: string; name: string; description: string; status: string }[] = [
  { key: "youtube", name: "YouTube", description: "Import liked videos and watch later", status: "available" },
  { key: "linkedin", name: "LinkedIn", description: "Capture saved posts via share sheet", status: "needs_setup" },
  { key: "instagram", name: "Instagram", description: "Capture saved reels via share sheet or screenshot OCR", status: "needs_setup" },
  { key: "chrome", name: "Chrome Extension", description: "One-click save from any tab", status: "coming_soon" },
  { key: "mobile", name: "Mobile App", description: "iOS/Android share extension", status: "coming_soon" },
  { key: "ocr", name: "Screenshot OCR", description: "Extract text from saved screenshots", status: "available" },
  { key: "github", name: "GitHub", description: "Sync starred repos and ship build packs as issues", status: "connected" },
  { key: "notion", name: "Notion", description: "Export build packs as Notion pages", status: "available" },
  { key: "gdrive", name: "Google Drive", description: "Save screenshots and documents", status: "available" },
  { key: "gmail", name: "Gmail", description: "Capture newsletters and saved emails", status: "needs_setup" },
  { key: "telegram", name: "Telegram Bot", description: "Forward to bot to capture into RecallOS", status: "coming_soon" },
  { key: "mcp", name: "MCP Server", description: "Expose your memory to any MCP-compatible client", status: "coming_soon" },
];

const PROJECTS = [
  {
    title: "AI job application automation agent",
    whyItMatters:
      "Combines saved resume tips, recruiter outreach templates, and AI agent patterns into a portfolio-grade product.",
    difficulty: "Intermediate",
    estBuildTime: "2 weekends",
    techStack: ["Next.js", "Prisma", "Gemini", "Playwright"],
    githubScore: 82,
    portfolioValue: 94,
  },
  {
    title: "RAG chatbot for personal memory",
    whyItMatters:
      "Use the open-source RAG repo + vector DB primer to ship a chatbot over RecallOS captures.",
    difficulty: "Intermediate",
    estBuildTime: "1 weekend",
    techStack: ["Next.js", "Prisma", "pgvector", "OpenAI"],
    githubScore: 88,
    portfolioValue: 88,
  },
  {
    title: "MCP server for RecallOS",
    whyItMatters:
      "Expose captured items as MCP tools — directly inspired by the saved MCP agent video.",
    difficulty: "Advanced",
    estBuildTime: "3 evenings",
    techStack: ["TypeScript", "MCP SDK", "Zod"],
    githubScore: 90,
    portfolioValue: 92,
  },
];

async function main() {
  console.log("→ seeding RecallOS demo data");

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: "Vaibhav" },
    create: { email: DEMO_EMAIL, name: "Vaibhav" },
  });

  // Wipe existing demo data for idempotent seeding
  await prisma.aiProcessingLog.deleteMany({ where: { userId: user.id } });
  await prisma.buildPack.deleteMany({ where: { userId: user.id } });
  await prisma.reminder.deleteMany({ where: { userId: user.id } });
  await prisma.prompt.deleteMany({ where: { userId: user.id } });
  await prisma.capturedItem.deleteMany({ where: { userId: user.id } });
  await prisma.projectIdea.deleteMany({ where: { userId: user.id } });
  await prisma.integration.deleteMany({ where: { userId: user.id } });
  await prisma.collection.deleteMany({ where: { userId: user.id } });

  const collection = await prisma.collection.create({
    data: {
      userId: user.id,
      name: "Default",
      description: "All captures",
      color: "#7c9cff",
    },
  });

  const tagNames = Array.from(
    new Set(ITEMS.flatMap((i) => i.tags)),
  );
  const tagMap = new Map<string, string>();
  for (const name of tagNames) {
    const t = await prisma.tag.upsert({
      where: { name },
      update: {},
      create: { name },
    });
    tagMap.set(name, t.id);
  }

  for (const it of ITEMS) {
    const created = await prisma.capturedItem.create({
      data: {
        userId: user.id,
        kind: it.kind,
        sourcePlatform: it.sourcePlatform,
        url: it.url,
        rawContent: it.rawContent,
        title: it.title,
        summary: it.summary,
        category: it.category,
        tagsJson: JSON.stringify(it.tags),
        metadataJson: JSON.stringify(it.metadata),
        scoresJson: JSON.stringify(it.scores),
        nextAction: it.nextAction,
        intent: it.intent,
        status: it.status,
        isProcessed: it.isProcessed,
        processedAt: it.isProcessed ? new Date(Date.now() - it.daysAgo * 86_400_000) : null,
        collectionId: collection.id,
        createdAt: new Date(Date.now() - it.daysAgo * 86_400_000),
        tags: {
          connect: it.tags.map((t) => ({ id: tagMap.get(t)! })),
        },
      },
    });
    await prisma.aiProcessingLog.create({
      data: {
        userId: user.id,
        itemId: created.id,
        provider: "mock",
        task: "process",
        ok: true,
        ms: 120,
        notes: "seeded",
      },
    });
  }

  for (const p of PROMPTS) {
    await prisma.prompt.create({
      data: {
        userId: user.id,
        title: p.title,
        body: p.body,
        improvedBody: p.improved,
        category: p.category,
        qualityScore: p.qualityScore,
        tagsJson: JSON.stringify(p.tags),
      },
    });
  }

  for (const r of REMINDERS) {
    await prisma.reminder.create({
      data: {
        userId: user.id,
        title: r.title,
        body: null,
        kind: r.kind,
        dueAt: new Date(Date.now() + r.inDays * 86_400_000),
        status: "due",
      },
    });
  }

  for (const i of INTEGRATIONS) {
    await prisma.integration.create({
      data: {
        userId: user.id,
        key: i.key,
        name: i.name,
        description: i.description,
        status: i.status,
        metadataJson: "{}",
      },
    });
  }

  for (const project of PROJECTS) {
    await prisma.projectIdea.create({
      data: {
        userId: user.id,
        title: project.title,
        whyItMatters: project.whyItMatters,
        sourceItemsJson: "[]",
        difficulty: project.difficulty,
        estBuildTime: project.estBuildTime,
        techStackJson: JSON.stringify(project.techStack),
        githubScore: project.githubScore,
        portfolioValue: project.portfolioValue,
      },
    });
  }

  console.log("✓ seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

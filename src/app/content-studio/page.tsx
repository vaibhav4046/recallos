import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listItems } from "@/lib/queries";
import {
  Megaphone,
  Twitter,
  Youtube,
  PenSquare,
  Layers,
  Sparkles,
} from "lucide-react";

export const dynamic = "force-dynamic";

const LINKEDIN_POSTS = [
  {
    hook: "I stopped saving and started shipping. Here's what changed.",
    body: "For 6 months I hoarded LinkedIn carousels, YouTube tutorials, and GitHub repos — and built nothing. Then I built RecallOS to flip the equation. In week 1: 3 portfolio projects, 18 reusable prompts, 12 callbacks.",
  },
  {
    hook: "Your saved tabs are a backlog, not a library.",
    body: "Every save is a decision deferred. RecallOS converts each capture into one of: project, prompt, learning sprint, job-search action, or — if it deserves it — archive.",
  },
];

const X_THREADS = [
  {
    topic: "Stop saving. Start building.",
    tweets: [
      "1/ I built RecallOS — an AI memory and execution system. It turned 6 months of saved content into 3 shipping projects in a weekend.",
      "2/ The unlock: every capture gets scored on usefulness × actionability × portfolio value. No more 'I'll get to it'.",
      "3/ Stack: Next.js App Router, Prisma, Tailwind, pluggable provider (Gemini → OpenAI → Anthropic → Groq → mock).",
      "4/ Lessons: the inbox is the product. If triage feels heavy, your scoring is wrong.",
      "5/ Free + local-first. Bring your own AI key or run the mock provider offline.",
    ],
  },
];

const BLOG_OUTLINES = [
  {
    title: "We don't need more save buttons. We need a build button.",
    sections: [
      "The save-button trap",
      "Why save-then-forget breaks builders",
      "What RecallOS does differently (scoring + intent)",
      "Architecture walk-through",
      "What's next: MCP server, mobile share, Chrome extension",
    ],
  },
];

const YOUTUBE_SCRIPT = [
  "Cold open: 30 saved tabs → 30 unfinished ideas.",
  "Beat 1: Define the problem — saved ≠ shipped.",
  "Beat 2: Demo the capture flow.",
  "Beat 3: Show inbox triage with AI scoring.",
  "Beat 4: Generate a build pack live. Show README export.",
  "CTA: Clone the repo, run it locally, save your first idea.",
];

const CAROUSELS = [
  {
    title: "5 signs your save-button habit is hurting you",
    slides: 7,
  },
  {
    title: "Build a portfolio from your saves in 3 weekends",
    slides: 5,
  },
];

export default async function ContentStudioPage() {
  const items = await listItems({ limit: 200 });
  const contentItems = items.filter(
    (i) => i.category === "Content Ideas" || i.tags.includes("content"),
  );

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Content studio</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Your saved memory, repackaged for <span className="text-accent">audience</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          RecallOS turns every cluster of saves into LinkedIn posts, X threads, blog outlines,
          and YouTube scripts. Personal brand on autopilot — minus the slop.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="LinkedIn posts"
            right={<Badge tone="accent"><Megaphone className="h-3 w-3" /> {LINKEDIN_POSTS.length}</Badge>}
          />
          <div className="space-y-3">
            {LINKEDIN_POSTS.map((p, i) => (
              <div key={i} className="rounded-xl border border-line-soft bg-bg-soft/40 p-3">
                <div className="text-sm font-semibold text-ink">{p.hook}</div>
                <p className="mt-1 text-sm text-ink-soft">{p.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="X/Twitter threads"
            right={<Badge tone="accent"><Twitter className="h-3 w-3" /> {X_THREADS.length}</Badge>}
          />
          {X_THREADS.map((t, i) => (
            <div key={i} className="rounded-xl border border-line-soft bg-bg-soft/40 p-3">
              <div className="text-sm font-semibold text-ink">{t.topic}</div>
              <ol className="mt-2 space-y-1.5 text-sm text-ink-soft">
                {t.tweets.map((tw, j) => (
                  <li key={j} className="flex gap-2">
                    <span className="text-accent">{j + 1}/</span>
                    <span>{tw.replace(/^\d+\/\s?/, "")}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Blog outlines" right={<Badge tone="accent"><PenSquare className="h-3 w-3" /> {BLOG_OUTLINES.length}</Badge>} />
          {BLOG_OUTLINES.map((b, i) => (
            <div key={i} className="rounded-xl border border-line-soft bg-bg-soft/40 p-3">
              <div className="text-sm font-semibold text-ink">{b.title}</div>
              <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                {b.sections.map((s) => (
                  <li key={s} className="flex gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {s}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </Card>

        <Card>
          <CardHeader title="YouTube script ideas" right={<Badge tone="accent"><Youtube className="h-3 w-3" /> 1</Badge>} />
          <ol className="space-y-2 text-sm text-ink-soft">
            {YOUTUBE_SCRIPT.map((b, i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                <span className="text-accent">#{i + 1}</span> {b}
              </li>
            ))}
          </ol>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Carousel concepts"
          right={<Badge tone="accent"><Layers className="h-3 w-3" /> {CAROUSELS.length}</Badge>}
        />
        <div className="grid gap-2 md:grid-cols-2">
          {CAROUSELS.map((c) => (
            <div key={c.title} className="rounded-xl border border-line-soft bg-bg-soft/40 p-3">
              <div className="text-sm font-semibold text-ink">{c.title}</div>
              <div className="mt-1 text-xs text-ink-mute">{c.slides} slides · IG / LinkedIn</div>
              <Button size="sm" className="mt-3">
                <Sparkles className="h-3.5 w-3.5" /> Draft slides
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader title="Personal brand notes" />
        <ul className="grid gap-2 text-sm text-ink-soft md:grid-cols-2">
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
            Lead with shipping, not learning. Every post ties to a built artifact.
          </li>
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
            Use the tagline "Stop saving. Start building." — repeat in profile + hero.
          </li>
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
            Cross-post a 5-tweet thread + 1 LinkedIn post + 1 YouTube short per project.
          </li>
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
            Drop one architecture diagram per week. Visuals get the saves you want.
          </li>
        </ul>
      </Card>

      <div className="text-xs text-ink-mute">Generated from {contentItems.length} content-related captures.</div>
    </div>
  );
}

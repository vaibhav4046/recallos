import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listItems } from "@/lib/queries";
import {
  Briefcase,
  MessageSquare,
  FileText,
  Lightbulb,
  CalendarClock,
  Send,
} from "lucide-react";

export const dynamic = "force-dynamic";

const RESUME_BULLETS = [
  "Shipped Musemint — an AI memory + execution system turning saved content into builder-ready briefs.",
  "Built a pluggable AI provider layer (Gemini / OpenAI / Anthropic / Groq) with mock fallback for offline dev.",
  "Designed Next.js App Router + Prisma + Tailwind stack with Playwright smoke and Vitest unit coverage.",
];

const RECRUITER_TEMPLATES = [
  {
    name: "Cold outreach",
    body: `Hi [Name],\n\nI saw [Company] is hiring for [Role]. I just shipped Musemint — an AI system that turns saved web content into ready-to-build project briefs. Three things I'd bring to your team:\n\n1. End-to-end TypeScript + AI provider abstraction\n2. Shipping bias: design → implement → tests → demo in days\n3. Clear writing — see [link]\n\nOpen to a 15-minute intro this week?`,
  },
  {
    name: "Application follow-up",
    body: `Hi [Name], just wanted to surface my application for [Role] from [Date]. Since applying I shipped [thing] — happy to walk through it. 15 minutes any time this week?`,
  },
];

const INTERVIEW_PREP = [
  "Behavioral: STAR for 'time you ran an ambiguous project end-to-end' — use Musemint build packs.",
  "System design: walk through Musemint architecture (provider abstraction, capture pipeline, memory graph).",
  "AI: explain mock provider fallback + cost-aware routing strategy.",
];

const SKILL_GAPS = [
  { skill: "Vector databases", priority: "high", proof: "RAG chatbot project" },
  { skill: "Production AI evals", priority: "medium", proof: "Inbox classifier" },
  { skill: "Mobile share extensions", priority: "medium", proof: "Musemint mobile capture" },
];

export default async function JobSearchPage() {
  const items = await listItems({ limit: 200 });
  const jobItems = items.filter(
    (i) => i.category === "Job Automation" || i.intent === "jobsearch",
  );

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Job-search vault</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Every save, turned into a <span className="text-accent">callback</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          Resume bullets, recruiter templates, interview prep, skill gaps, and reminders —
          all generated from the career content you've already saved.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Resume bullet ideas"
            description="Outcomes-first, ready to paste."
            right={<Badge tone="accent">{RESUME_BULLETS.length}</Badge>}
          />
          <ul className="space-y-2">
            {RESUME_BULLETS.map((b, i) => (
              <li key={i} className="rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-soft">
                <FileText className="mr-1 inline h-3.5 w-3.5 text-accent" /> {b}
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Recruiter outreach templates" />
          <div className="space-y-3">
            {RECRUITER_TEMPLATES.map((t) => (
              <div key={t.name} className="rounded-lg border border-line-soft bg-bg-soft/40 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-sm font-semibold text-ink">{t.name}</div>
                  <Badge tone="muted">
                    <MessageSquare className="h-3 w-3" /> template
                  </Badge>
                </div>
                <pre className="whitespace-pre-wrap text-xs text-ink-soft">{t.body}</pre>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Interview prep notes" />
          <ul className="space-y-2">
            {INTERVIEW_PREP.map((i) => (
              <li key={i} className="flex gap-2 rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-soft">
                <Lightbulb className="mt-0.5 h-4 w-4 text-warn" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Skill gaps"
            description="Inferred from your saves — close them with portfolio proof."
          />
          <div className="space-y-2">
            {SKILL_GAPS.map((g) => (
              <div
                key={g.skill}
                className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3"
              >
                <div>
                  <div className="text-sm font-semibold text-ink">{g.skill}</div>
                  <div className="text-xs text-ink-mute">Proof: {g.proof}</div>
                </div>
                <Badge tone={g.priority === "high" ? "accent" : "muted"}>{g.priority}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Application reminders" right={<Badge tone="accent">Weekly</Badge>} />
          <ul className="space-y-2">
            <li className="flex gap-2 rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-soft">
              <CalendarClock className="mt-0.5 h-4 w-4 text-accent" />
              <span>Send 3 recruiter messages using the new outreach template.</span>
            </li>
            <li className="flex gap-2 rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-soft">
              <Send className="mt-0.5 h-4 w-4 text-accent" />
              <span>Follow up on the [Role] application sent 5 days ago.</span>
            </li>
            <li className="flex gap-2 rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-soft">
              <Briefcase className="mt-0.5 h-4 w-4 text-accent" />
              <span>Update LinkedIn headline with Musemint shipping line.</span>
            </li>
          </ul>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="Source captures"
          description="The saved career content powering this vault."
          right={<Badge tone="accent">{jobItems.length}</Badge>}
        />
        {jobItems.length === 0 ? (
          <p className="text-sm text-ink-mute">No saved career content yet — capture a LinkedIn post to seed the vault.</p>
        ) : (
          <div className="grid gap-2 md:grid-cols-2">
            {jobItems.slice(0, 6).map((i) => (
              <div key={i.id} className="rounded-lg border border-line-soft bg-bg-soft/40 p-3">
                <div className="text-[11px] uppercase tracking-wider text-ink-mute">
                  {i.sourcePlatform}
                </div>
                <div className="mt-0.5 text-sm font-medium text-ink">{i.title}</div>
                <div className="mt-1 text-xs text-ink-soft line-clamp-2">{i.summary}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="text-xs text-ink-mute">
        Musemint never auto-applies. All outreach is human-approved.
      </div>
    </div>
  );
}

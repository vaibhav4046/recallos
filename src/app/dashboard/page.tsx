import Link from "next/link";
import { Card, CardHeader, Stat } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ItemCard } from "@/components/ItemCard";
import { listItems, listProjects, listReminders, listPrompts, getStats } from "@/lib/queries";
import {
  Plus,
  FileUp,
  StickyNote,
  Hammer,
  Sparkles,
  Bell,
  ArrowUpRight,
  Trophy,
  Inbox,
} from "lucide-react";
import { formatRelative } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [items, projects, reminders, prompts, stats] = await Promise.all([
    listItems({ limit: 6 }),
    listProjects(),
    listReminders(),
    listPrompts(),
    getStats(),
  ]);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const n = (x: number, noun: string) => `${x} ${noun}${x === 1 ? "" : "s"}`;
  const suggestion =
    stats.forgottenGems > 0
      ? `${n(stats.forgottenGems, "forgotten gem")} sat untouched for 5+ days — triage before they go stale.`
      : prompts.length > 0
        ? `Your prompt “${prompts[0].title}” is ready to reuse — quality ${prompts[0].qualityScore}.`
        : stats.readyToBuild > 0
          ? `${n(stats.readyToBuild, "project brief")} ready — open Ready to Build and ship one this weekend.`
          : "Capture a link, note, or screenshot to start building your memory.";

  const upcomingReminders = reminders
    .filter((r) => r.status === "due")
    .slice(0, 3);

  const forgottenGems = items
    .filter((i) => i.status === "inbox")
    .slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="field-label">{greeting}, Vaibhav</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink text-balance">
            Your saved work is{" "}
            <span className="text-accent">ready to build.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            {stats.processed === 0
              ? "Capture your first link, note, or screenshot — Musemint classifies, scores, and turns it into something you can ship."
              : `Musemint turned ${n(stats.processed, "processed capture")} into ${n(stats.readyToBuild, "project brief")}, ${n(stats.prompts, "reusable prompt")}, and ${n(stats.jobActions, "job-search action")}. Pick a card and ship.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/capture" className="btn-primary">
            <Plus className="h-4 w-4" /> Save link
          </Link>
          <Link href="/capture?kind=screenshot" className="btn-ghost">
            <FileUp className="h-4 w-4" /> Upload screenshot
          </Link>
          <Link href="/capture?kind=note" className="btn-ghost">
            <StickyNote className="h-4 w-4" /> Add note
          </Link>
          <Link href="/ready-to-build" className="btn-ghost">
            <Hammer className="h-4 w-4" /> Generate project
          </Link>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Saved items" value={stats.saved} hint="across all platforms" />
        <Stat label="Processed by AI" value={stats.processed} hint={`${stats.classificationConfidence}% confidence`} accent />
        <Stat label="Ready to build" value={stats.readyToBuild} hint="project briefs" />
        <Stat label="Forgotten gems" value={stats.forgottenGems} hint="5+ days untouched" />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Prompts extracted" value={stats.prompts} hint="reusable prompts" />
        <Stat label="Portfolio-worthy" value={stats.portfolioWorthy} hint="score ≥ 80" />
        <Stat label="Job-search actions" value={stats.jobActions} hint="this week" />
        <Stat label="Memory health" value={`${stats.memoryHealth}%`} hint="triage + freshness" />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Your files are ready"
            description="The captures most likely to ship this weekend."
            right={
              <Link href="/ready-to-build" className="text-sm text-accent hover:text-accent-glow inline-flex items-center gap-1">
                Open all <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <div className="space-y-3">
            {projects.slice(0, 3).map((p) => (
              <Link
                key={p.id}
                href={`/ready-to-build`}
                className="group flex items-start gap-3 rounded-xl border border-line-soft bg-bg-soft/40 p-4 card-hover"
              >
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                  <Hammer className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink">{p.title}</div>
                  <div className="text-xs text-ink-mute">{p.whyItMatters}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Badge tone="accent">Portfolio {p.portfolioValue}</Badge>
                    <Badge tone="success">GitHub-ready {p.githubScore}</Badge>
                    <Badge tone="muted">{p.difficulty}</Badge>
                    <Badge tone="muted">{p.estBuildTime}</Badge>
                  </div>
                </div>
                <ArrowUpRight className="h-4 w-4 text-ink-mute transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent" />
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Today"
            description="What you'll act on."
            right={<Badge tone="accent">Live</Badge>}
          />
          <div className="space-y-3">
            <div className="rounded-xl border border-line-soft bg-bg-soft/40 p-3">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-mute">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                <span>AI suggestion</span>
              </div>
              <div className="mt-1 text-sm text-ink">{suggestion}</div>
            </div>
            {upcomingReminders.length === 0 ? (
              <div className="rounded-xl border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-mute">
                No reminders due. Capture something to keep the engine warm.
              </div>
            ) : (
              upcomingReminders.map((r) => (
                <div
                  key={r.id}
                  className="flex items-start gap-2 rounded-xl border border-line-soft bg-bg-soft/40 p-3"
                >
                  <Bell className="mt-0.5 h-4 w-4 text-accent" />
                  <div>
                    <div className="text-sm text-ink">{r.title}</div>
                    <div className="text-[11px] uppercase tracking-wider text-ink-mute">
                      Due {formatRelative(r.dueAt)}
                    </div>
                  </div>
                </div>
              ))
            )}
            <Link href="/reminders" className="btn-ghost w-full justify-center">
              Open reminders
            </Link>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Forgotten gems" description="Captures 5+ days old" right={<Badge tone="warn">{stats.forgottenGems}</Badge>} />
          <div className="space-y-3">
            {forgottenGems.map((it) => (
              <div key={it.id} className="rounded-xl border border-line-soft bg-bg-soft/40 p-3">
                <div className="text-xs uppercase tracking-wider text-ink-mute">
                  {it.sourcePlatform}
                </div>
                <div className="mt-0.5 text-sm text-ink line-clamp-2">{it.title}</div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-ink-mute">
                  <span>{formatRelative(it.createdAt)}</span>
                  <Link href="/inbox" className="text-accent hover:text-accent-glow">
                    Triage →
                  </Link>
                </div>
              </div>
            ))}
            {forgottenGems.length === 0 ? (
              <p className="text-sm text-ink-mute">No forgotten gems — well-triaged.</p>
            ) : null}
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Prompt library"
            description="Your AI-improved prompts."
            right={
              <Link href="/prompts" className="text-sm text-accent inline-flex items-center gap-1">
                Open <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <ul className="space-y-2">
            {prompts.length === 0 ? (
              <li className="rounded-xl border border-line-soft bg-bg-soft/40 p-3 text-sm text-ink-mute">
                No prompts yet — promote a capture or save one from the inbox.
              </li>
            ) : (
              prompts.slice(0, 3).map((p) => (
                <li
                  key={p.id}
                  className="rounded-xl border border-line-soft bg-bg-soft/40 p-3"
                >
                  <div className="text-sm text-ink line-clamp-1">{p.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-mute">
                    <Trophy className="h-3.5 w-3.5 text-warn" />
                    Quality {p.qualityScore} · {p.category}
                  </div>
                </li>
              ))
            )}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Recent captures"
            description="Latest from share sheet, browser, notes."
            right={
              <Link href="/inbox" className="text-sm text-accent inline-flex items-center gap-1">
                <Inbox className="h-3.5 w-3.5" />
                Inbox
              </Link>
            }
          />
          <div className="space-y-3">
            {items.slice(0, 3).map((i) => (
              <ItemCard key={i.id} item={i} compact />
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
}

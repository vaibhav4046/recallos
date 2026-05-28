import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBar } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { listItems } from "@/lib/queries";
import { GraduationCap, BookOpenCheck, Hammer, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearningPage() {
  const items = await listItems({ limit: 100 });
  const learn = items.filter(
    (i) =>
      i.category === "Learning Resources" ||
      i.intent === "learn" ||
      i.tags.some((t) => t === "learning"),
  );
  const priority = learn
    .map((i) => ({
      item: i,
      score: i.scores.usefulness * 0.7 + i.scores.actionability * 0.3,
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Learning queue</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Turn saved tutorials into <span className="text-accent">study sprints</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          Musemint ranks each learning save by usefulness × actionability. Pick a topic,
          set the time, and build something tangible at the end.
        </p>
      </header>

      {priority.length === 0 ? (
        <Card>
          <CardHeader
            title="No learning saves yet"
            description="Capture an article, video, or course and tag it Learning."
          />
          <Link href="/capture" className="btn-primary inline-flex w-fit">
            <Sparkles className="h-4 w-4" /> Add to queue
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {priority.map(({ item, score }) => (
            <Card key={item.id}>
              <CardHeader
                title={item.title}
                description={item.summary ?? "Saved learning resource"}
                right={<Badge tone="accent">Priority {Math.round(score)}</Badge>}
              />
              <div className="grid grid-cols-2 gap-3">
                <ScoreBar label="Usefulness" value={item.scores.usefulness} />
                <ScoreBar label="Actionable" value={item.scores.actionability} tone="success" />
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.tags.slice(0, 6).map((t) => (
                  <Badge key={t} tone="muted">{t}</Badge>
                ))}
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3 text-xs text-ink-mute">
                <div className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                  <div className="field-label">Est. time</div>
                  <div className="mt-0.5 text-ink-soft">
                    {item.tags.includes("video") ? "30–60 min" : "45 min read"}
                  </div>
                </div>
                <div className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                  <div className="field-label">Resources</div>
                  <div className="mt-0.5 text-ink-soft">{item.url ? "1 link" : "Notes only"}</div>
                </div>
                <div className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                  <div className="field-label">Status</div>
                  <div className="mt-0.5 text-ink-soft capitalize">{item.status}</div>
                </div>
              </div>
              <div className="mt-4 rounded-xl border border-accent/20 bg-accent/[0.06] p-3">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-accent">
                  <Sparkles className="h-3 w-3" /> AI notes
                </div>
                <p className="mt-1 text-sm text-ink-soft">{item.nextAction ?? "Skim → take 5-bullet summary → build a tiny demo."}</p>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                <Button size="sm">
                  <BookOpenCheck className="h-3.5 w-3.5" /> Quiz me
                </Button>
                <Button size="sm" variant="primary">
                  <Hammer className="h-3.5 w-3.5" /> Build something from this
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import {
  Bell,
  Check,
  Clock,
  Plus,
  Trash2,
  Hammer,
  Briefcase,
  GraduationCap,
  Sparkles,
} from "lucide-react";

const KIND_META: Record<string, { label: string; tone: "accent" | "success" | "warn" | "muted"; icon: any }> = {
  forgotten: { label: "Forgotten save", tone: "warn", icon: Sparkles },
  build: { label: "Build this", tone: "accent", icon: Hammer },
  learn: { label: "Learning review", tone: "success", icon: GraduationCap },
  job: { label: "Job-search", tone: "accent", icon: Briefcase },
  digest: { label: "Digest", tone: "muted", icon: Bell },
  prompt: { label: "Prompt use", tone: "muted", icon: Sparkles },
  finish: { label: "Finish project", tone: "warn", icon: Hammer },
  review: { label: "Monthly review", tone: "muted", icon: Bell },
};

interface Reminder {
  id: string;
  title: string;
  body: string | null;
  kind: string;
  dueAt: string;
  status: string;
}

function dueLabel(d: string) {
  const date = new Date(d);
  const ms = date.getTime() - Date.now();
  const day = 86_400_000;
  if (ms < -day) return `${Math.floor(-ms / day)}d overdue`;
  if (ms < 0) return "Due now";
  if (ms < day) return "Due today";
  if (ms < 2 * day) return "Due tomorrow";
  if (ms < 7 * day) return `In ${Math.floor(ms / day)}d`;
  return date.toLocaleDateString();
}

export default function RemindersPage() {
  const [reminders, setReminders] = useState<Reminder[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState("build");
  const [dueAt, setDueAt] = useState("");
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/reminders");
    const json = await res.json();
    setReminders(json.reminders);
  }
  useEffect(() => {
    load();
  }, []);

  async function create() {
    if (!title || !dueAt) return;
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, kind, dueAt: new Date(dueAt).toISOString() }),
    });
    if (res.ok) {
      toast({ kind: "success", title: "Reminder added" });
      setTitle("");
      setDueAt("");
      setOpen(false);
      load();
    }
  }

  async function patch(id: string, body: any) {
    await fetch(`/api/reminders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    toast({ kind: "success", title: "Removed" });
    load();
  }

  const due = (reminders ?? []).filter((r) => r.status === "due");
  const done = (reminders ?? []).filter((r) => r.status === "done");

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="field-label">Reminders</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Light, smart nudges — <span className="text-accent">no notification fatigue</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            Forgotten saves, weekend builds, learning reviews, and digests — all surfaced when
            you can act, not when you're heads-down.
          </p>
        </div>
        <Button variant="primary" onClick={() => setOpen((v) => !v)}>
          <Plus className="h-4 w-4" /> New reminder
        </Button>
      </header>

      {open ? (
        <Card>
          <CardHeader title="New reminder" />
          <div className="grid gap-3 md:grid-cols-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="input md:col-span-2"
            />
            <input
              type="datetime-local"
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
              className="input"
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(KIND_META).map(([k, m]) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`rounded-full px-3 py-1.5 text-xs ${
                  kind === k
                    ? "bg-accent/15 text-accent border border-accent/30"
                    : "border border-line-soft text-ink-soft hover:text-ink"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={create}>
              Save
            </Button>
          </div>
        </Card>
      ) : null}

      {reminders === null ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel h-20 shimmer" />
          ))}
        </div>
      ) : due.length === 0 && done.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-5 w-5" />}
          title="No reminders"
          description="Capture an item and pick 'create reminder' to seed your queue."
        />
      ) : (
        <div className="space-y-6">
          <section className="space-y-2">
            <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-mute">
              Due {due.length ? `· ${due.length}` : ""}
            </h2>
            <div className="space-y-2">
              {due.map((r) => {
                const meta = KIND_META[r.kind] ?? KIND_META.forgotten;
                const Icon = meta.icon;
                return (
                  <div
                    key={r.id}
                    className="panel flex flex-wrap items-center justify-between gap-3 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-ink">{r.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-mute">
                          <Badge tone={meta.tone}>{meta.label}</Badge>
                          <Clock className="h-3 w-3" />
                          {dueLabel(r.dueAt)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        onClick={() =>
                          patch(r.id, {
                            status: "snoozed",
                            snoozedTo: new Date(Date.now() + 3 * 86_400_000).toISOString(),
                          })
                        }
                      >
                        Snooze 3d
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => patch(r.id, { status: "done" })}
                      >
                        <Check className="h-3.5 w-3.5" /> Done
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => remove(r.id)} aria-label="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {done.length ? (
            <section className="space-y-2">
              <h2 className="text-[11px] uppercase tracking-[0.18em] text-ink-mute">
                Done · {done.length}
              </h2>
              <div className="space-y-2">
                {done.map((r) => (
                  <div key={r.id} className="panel-soft flex items-center justify-between gap-3 p-3 text-sm text-ink-mute">
                    <span className="line-through">{r.title}</span>
                    <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}

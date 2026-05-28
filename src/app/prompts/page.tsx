"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Copy, Sparkles, Plus, FileCode, Trophy, History } from "lucide-react";

interface Prompt {
  id: string;
  title: string;
  body: string;
  improvedBody?: string | null;
  category: string;
  qualityScore: number;
  tags: string[];
}

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<Prompt[] | null>(null);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState("general");
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/prompts");
    const json = await res.json();
    setPrompts(json.prompts);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSubmit() {
    if (!title || !body) return;
    setBusy(true);
    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, category, tags: [category] }),
      });
      if (!res.ok) throw new Error("Save failed");
      toast({ kind: "success", title: "Prompt saved", body: "RecallOS improved and scored it." });
      setTitle("");
      setBody("");
      setOpen(false);
      load();
    } catch (err: any) {
      toast({ kind: "error", title: "Save failed", body: err.message });
    } finally {
      setBusy(false);
    }
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    toast({ kind: "success", title: "Copied to clipboard" });
  }

  const categories = Array.from(new Set((prompts ?? []).map((p) => p.category)));

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="field-label">Prompt library</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Reusable prompts, <span className="text-accent">AI-improved</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            Every prompt has an original and an improved version. Use any for a new project,
            or copy directly to your favorite tool.
          </p>
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" /> New prompt
        </Button>
      </header>

      {open ? (
        <Card>
          <CardHeader title="New prompt" />
          <div className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title"
              className="input"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Prompt body…"
              rows={5}
              className="input"
            />
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Category (e.g. marketing, career, engineering)"
              className="input"
            />
            <div className="flex items-center justify-end gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={onSubmit} disabled={busy}>
                {busy ? "Saving…" : "Save + improve"}
              </Button>
            </div>
          </div>
        </Card>
      ) : null}

      {prompts === null ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="panel h-48 shimmer" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <EmptyState
          icon={<Sparkles className="h-5 w-5" />}
          title="No prompts yet"
          description="Save a prompt — RecallOS will improve, score, and tag it."
          action={
            <Button variant="primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" /> Create prompt
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {categories.map((c) => (
            <section key={c}>
              <h2 className="mb-2 text-[11px] uppercase tracking-[0.18em] text-ink-mute">{c}</h2>
              <div className="grid gap-3 md:grid-cols-2">
                {prompts
                  .filter((p) => p.category === c)
                  .map((p) => (
                    <Card key={p.id}>
                      <CardHeader
                        title={p.title}
                        right={
                          <Badge tone={p.qualityScore >= 80 ? "accent" : "muted"}>
                            <Trophy className="h-3 w-3" /> {p.qualityScore}
                          </Badge>
                        }
                      />
                      <div className="space-y-3">
                        <div>
                          <div className="field-label">Original</div>
                          <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-xs text-ink-soft">
                            {p.body}
                          </pre>
                        </div>
                        {p.improvedBody ? (
                          <div>
                            <div className="field-label flex items-center gap-1.5">
                              <Sparkles className="h-3 w-3 text-accent" /> AI-improved
                            </div>
                            <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap rounded-lg border border-accent/20 bg-accent/[0.06] p-3 text-xs text-ink-soft">
                              {p.improvedBody}
                            </pre>
                          </div>
                        ) : null}
                        <div className="flex items-center justify-between">
                          <div className="flex gap-1.5">
                            {p.tags.slice(0, 4).map((t) => (
                              <Badge key={t} tone="muted">{t}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button size="sm" onClick={() => copy(p.improvedBody ?? p.body)}>
                              <Copy className="h-3.5 w-3.5" /> Copy
                            </Button>
                            <Button size="sm" variant="primary">
                              <FileCode className="h-3.5 w-3.5" /> Use for new project
                            </Button>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-ink-mute">
                          <History className="h-3 w-3" /> v1 · created from inbox
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

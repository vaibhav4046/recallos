"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Copy,
  Download,
  FileCode,
  ListTodo,
  FileText,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

interface Pack {
  overview: string;
  problemStatement: string;
  userStories: string[];
  features: string[];
  techStack: string[];
  architecture: string;
  apiPlan: { method: string; path: string; description: string }[];
  databaseSchema: { entity: string; fields: string[] }[];
  uiScreens: string[];
  tasks: string[];
  prompts: string[];
  readme: string;
  resumeBullets: string[];
}

export default function BuildPackPage() {
  const params = useParams() as { id: string };
  const toast = useToast();
  const [data, setData] = useState<{ buildPack: { contentJson: string; project: { title: string }; markdown: string; readme: string; checklist: string } } | null>(null);

  useEffect(() => {
    fetch(`/api/build-packs/${params.id}`)
      .then((r) => r.json())
      .then(setData);
  }, [params.id]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="panel h-32 shimmer" />
        <div className="panel h-96 shimmer" />
      </div>
    );
  }

  const pack: Pack = JSON.parse(data.buildPack.contentJson);

  function download(format: "markdown" | "readme" | "checklist" | "json") {
    if (format === "json") {
      const blob = new Blob([JSON.stringify(pack, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${data!.buildPack.project.title}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    window.location.href = `/api/build-packs/${params.id}?format=${format}`;
  }

  async function copy(text: string, label: string) {
    await navigator.clipboard.writeText(text);
    toast({ kind: "success", title: "Copied", body: label });
  }

  return (
    <div className="space-y-6">
      <Link href="/ready-to-build" className="inline-flex items-center gap-1.5 text-sm text-ink-mute hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Ready to Build
      </Link>
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="field-label">Build pack</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            {data.buildPack.project.title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-ink-mute">{pack.overview}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => download("markdown")}>
            <Download className="h-4 w-4" /> Markdown
          </Button>
          <Button onClick={() => download("readme")}>
            <FileText className="h-4 w-4" /> README
          </Button>
          <Button onClick={() => download("checklist")}>
            <ListTodo className="h-4 w-4" /> Checklist
          </Button>
          <Button onClick={() => download("json")}>
            <FileCode className="h-4 w-4" /> JSON
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Problem statement" />
          <p className="text-sm text-ink-soft">{pack.problemStatement}</p>
        </Card>
        <Card>
          <CardHeader title="Architecture" />
          <p className="text-sm text-ink-soft whitespace-pre-line">{pack.architecture}</p>
        </Card>
        <Card>
          <CardHeader title="Tech stack" />
          <div className="flex flex-wrap gap-1.5">
            {pack.techStack.map((t) => (
              <Badge key={t} tone="muted">{t}</Badge>
            ))}
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="User stories" right={<Badge tone="accent">{pack.userStories.length}</Badge>} />
          <ul className="space-y-2">
            {pack.userStories.map((u, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-soft">
                <CheckCircle2 className="mt-0.5 h-4 w-4 text-success" /> {u}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Features" right={<Badge tone="accent">{pack.features.length}</Badge>} />
          <ul className="space-y-2">
            {pack.features.map((u, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-soft">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {u}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="API plan" />
          <ul className="space-y-2 text-sm">
            {pack.apiPlan.map((a, i) => (
              <li key={i} className="flex items-start gap-3 rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                <Badge tone={a.method === "POST" ? "accent" : a.method === "GET" ? "success" : "warn"}>
                  {a.method}
                </Badge>
                <div>
                  <div className="font-mono text-xs text-ink">{a.path}</div>
                  <div className="text-xs text-ink-mute">{a.description}</div>
                </div>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Database schema" />
          <ul className="space-y-2 text-sm">
            {pack.databaseSchema.map((d, i) => (
              <li key={i} className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                <div className="font-mono text-sm text-ink">{d.entity}</div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {d.fields.map((f) => (
                    <span key={f} className="rounded bg-bg-raised px-1.5 py-0.5 font-mono text-[11px] text-ink-soft">
                      {f}
                    </span>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="UI screens" />
          <ul className="space-y-1.5 text-sm text-ink-soft">
            {pack.uiScreens.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent" /> {s}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Tasks" right={<Badge tone="accent">{pack.tasks.length}</Badge>} />
          <ul className="space-y-1.5 text-sm">
            {pack.tasks.map((t, i) => (
              <li key={i} className="flex items-start gap-2 text-ink-soft">
                <input type="checkbox" className="mt-1 accent-accent" /> {t}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Prompts"
            right={
              <Button size="sm" onClick={() => copy(pack.prompts.join("\n\n"), "Prompts copied")}>
                <Copy className="h-3.5 w-3.5" /> Copy all
              </Button>
            }
          />
          <ul className="space-y-2 text-sm">
            {pack.prompts.map((p, i) => (
              <li key={i} className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5 text-ink-soft">
                {p}
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <CardHeader
            title="Resume bullets"
            right={
              <Button size="sm" onClick={() => copy(pack.resumeBullets.join("\n"), "Resume bullets copied")}>
                <Copy className="h-3.5 w-3.5" /> Copy all
              </Button>
            }
          />
          <ul className="space-y-2 text-sm">
            {pack.resumeBullets.map((b, i) => (
              <li key={i} className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5 text-ink-soft">
                {b}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card>
        <CardHeader
          title="README draft"
          right={
            <Button size="sm" onClick={() => copy(pack.readme, "README copied")}>
              <Copy className="h-3.5 w-3.5" /> Copy
            </Button>
          }
        />
        <pre className="overflow-x-auto rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-xs leading-relaxed text-ink-soft">
          {pack.readme}
        </pre>
      </Card>
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBar } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { Hammer, Sparkles, ArrowRight, GitBranch, Clock, Cpu } from "lucide-react";
import { useRouter } from "next/navigation";

type Project = {
  id: string;
  title: string;
  whyItMatters: string;
  difficulty: string;
  estBuildTime: string;
  techStack: string[];
  githubScore: number;
  portfolioValue: number;
  status: string;
  createdAt: string;
};

export default function ReadyToBuildPage() {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const toast = useToast();
  const router = useRouter();

  async function load() {
    const res = await fetch("/api/projects");
    const json = await res.json();
    setProjects(json.projects);
  }

  useEffect(() => {
    load();
  }, []);

  async function onGenerate(projectId: string) {
    setBusyId(projectId);
    try {
      const res = await fetch(`/api/projects/${projectId}/build-pack`, { method: "POST" });
      if (!res.ok) throw new Error("Generation failed");
      const { buildPack } = await res.json();
      toast({ kind: "success", title: "Build pack ready", body: "Opening generated brief…" });
      router.push(`/build-packs/${buildPack.id}`);
    } catch (err: any) {
      toast({ kind: "error", title: "Build pack failed", body: err.message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="field-label">Ready to build</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink text-balance">
            Project briefs distilled from your <span className="text-accent">saved memory</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            Each card is a portfolio-grade brief. Click Generate Build Pack to expand
            into a full implementation pack with README, API plan, schema, and tasks.
          </p>
        </div>
        <Link href="/inbox" className="btn-ghost">
          <Sparkles className="h-4 w-4" /> Generate from inbox
        </Link>
      </header>

      {projects === null ? (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel h-64 shimmer" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Hammer className="h-5 w-5" />}
          title="Nothing buildable yet"
          description="Triage your inbox and turn a capture into a project."
          action={
            <Link href="/inbox" className="btn-primary">
              Open inbox
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {projects.map((p) => (
            <Card key={p.id} className="flex flex-col gap-4">
              <CardHeader
                title={p.title}
                description={p.whyItMatters}
                right={<Badge tone={p.portfolioValue >= 80 ? "accent" : "muted"}>Portfolio {p.portfolioValue}</Badge>}
              />
              <div className="grid grid-cols-2 gap-3">
                <ScoreBar label="GitHub readiness" value={p.githubScore} tone="success" />
                <ScoreBar label="Portfolio value" value={p.portfolioValue} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {p.techStack.slice(0, 6).map((t) => (
                  <Badge key={t} tone="muted">
                    {t}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-ink-mute">
                <span className="inline-flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5" />
                  {p.difficulty}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {p.estBuildTime}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <GitBranch className="h-3.5 w-3.5" />
                  {p.status === "building" ? "Already drafting" : "Idea"}
                </span>
              </div>
              <div className="mt-auto flex items-center justify-end gap-2">
                <Button
                  variant="primary"
                  onClick={() => onGenerate(p.id)}
                  disabled={busyId === p.id}
                >
                  {busyId === p.id ? "Generating…" : (
                    <>
                      <Hammer className="h-4 w-4" />
                      Generate Build Pack
                    </>
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, ArrowUpRight, Lightbulb, Zap } from "lucide-react";

interface Insight {
  headline: string;
  bullets: string[];
  cta: string;
  provider: string;
}

interface StatsLite {
  saved: number;
  processed: number;
  readyToBuild: number;
  forgottenGems: number;
  memoryHealth: number;
  classificationConfidence: number;
}

export function RightPanel() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [stats, setStats] = useState<StatsLite | null>(null);

  useEffect(() => {
    fetch("/api/digest")
      .then((r) => r.json())
      .then((j) => setInsight(j))
      .catch(() => setInsight(null));
    fetch("/api/stats")
      .then((r) => r.json())
      .then((j) => setStats(j))
      .catch(() => setStats(null));
  }, []);

  return (
    <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-4 border-l border-line/70 bg-bg-panel/40 px-4 py-4 backdrop-blur-md">
      <div className="panel p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-mute">
          <Sparkles className="h-3.5 w-3.5 text-accent" />
          <span>Daily AI digest</span>
          <span className="ml-auto chip-accent">{insight?.provider ?? "mock"}</span>
        </div>
        <div className="text-base font-semibold tracking-tight text-ink">
          {insight?.headline ?? "Your daily RecallOS digest"}
        </div>
        <ul className="mt-3 space-y-2">
          {(insight?.bullets ?? [
            "Top captures load in seconds…",
            "Ranking ideas by portfolio value…",
            "Surfacing forgotten gems…",
          ]).map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink-soft">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/ready-to-build"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-glow"
        >
          {insight?.cta ?? "Open ready-to-build"}
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="panel p-4">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-mute">
          <Zap className="h-3.5 w-3.5 text-accent" />
          <span>Memory health</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-semibold tracking-tight text-ink">
            {stats?.memoryHealth ?? "—"}
          </span>
          <span className="text-sm text-ink-mute">/ 100</span>
        </div>
        <div className="mt-2 h-1.5 w-full rounded-full bg-bg-soft">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent to-accent-glow transition-all duration-500"
            style={{ width: `${stats?.memoryHealth ?? 0}%` }}
          />
        </div>
        <div className="mt-3 text-xs text-ink-mute">
          AI classification confidence{" "}
          <span className="text-ink-soft">
            {stats ? `${stats.classificationConfidence}%` : "—"}
          </span>
        </div>
      </div>

      <div className="panel p-4">
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-mute">
          <Lightbulb className="h-3.5 w-3.5 text-accent" />
          <span>Forgotten gems</span>
        </div>
        <p className="text-sm text-ink-soft">
          {stats === null
            ? "Checking for stale captures…"
            : stats.forgottenGems === 0
              ? "Nothing stale — your memory is well-triaged. Capture something to keep momentum."
              : `${stats.forgottenGems} capture${stats.forgottenGems === 1 ? "" : "s"} haven't been touched in 5+ days. Most likely candidates for a weekend build.`}
        </p>
        <Link
          href="/inbox?status=inbox"
          className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:text-accent-glow"
        >
          Triage now
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </aside>
  );
}

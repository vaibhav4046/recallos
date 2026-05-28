"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Network, Filter, Sparkles, X } from "lucide-react";

const CLUSTER_TONE: Record<string, "accent" | "success" | "warn" | "muted"> = {
  "AI Agents": "accent",
  "Job Automation": "success",
  "UI Inspiration": "warn",
  "Data Science": "muted",
  "Prompt Engineering": "accent",
  "Full-stack Projects": "success",
  "Learning Resources": "muted",
  "Content Ideas": "warn",
};

interface Item {
  id: string;
  title: string;
  sourcePlatform: string;
  category: string;
}

interface Props {
  items: Item[];
  clusterOrder: string[];
  totalProcessed: number;
}

export function MemoryGraphView({ items, clusterOrder, totalProcessed }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const clusters = useMemo(() => {
    const out: Record<string, Item[]> = {};
    for (const cat of clusterOrder) out[cat] = [];
    for (const it of items) {
      const c = it.category || "General";
      if (!out[c]) out[c] = [];
      out[c].push(it);
    }
    return out;
  }, [items, clusterOrder]);

  const filteredItems = selected ? clusters[selected] ?? [] : items;

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Memory graph</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Your saved memory, <span className="text-accent">clustered by purpose</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          Tap a bubble to filter the list below. Bigger bubbles are denser clusters — your
          latent project ideas.
        </p>
      </header>

      <section className="panel relative overflow-hidden p-6">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            background:
              "radial-gradient(circle at 30% 20%, rgba(124,156,255,0.18), transparent 60%)",
          }}
        />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {clusterOrder.map((cat) => {
            const list = clusters[cat] ?? [];
            const size = Math.min(180, 80 + list.length * 14);
            const tone = CLUSTER_TONE[cat] ?? "muted";
            const active = selected === cat;
            const disabled = list.length === 0;
            return (
              <div key={cat} className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (disabled) return;
                    setSelected(active ? null : cat);
                  }}
                  aria-pressed={active}
                  aria-label={`Filter by ${cat} (${list.length} items)`}
                  disabled={disabled}
                  className={`relative grid place-items-center rounded-full border text-center transition-all focus:outline-none focus:ring-2 focus:ring-accent/50 ${
                    active
                      ? "border-accent bg-accent/15 scale-105"
                      : disabled
                        ? "border-line-soft bg-bg-soft/30 opacity-60 cursor-not-allowed"
                        : "border-accent/30 bg-accent/[0.08] hover:bg-accent/[0.14] hover:scale-105 cursor-pointer"
                  }`}
                  style={{ width: size, height: size }}
                >
                  <div>
                    <div className="text-2xl font-semibold text-ink">{list.length}</div>
                    <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                      {cat}
                    </div>
                  </div>
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{ boxShadow: "0 0 60px -10px rgba(124,156,255,0.35) inset" }}
                  />
                </button>
                <Badge tone={tone}>{cat}</Badge>
              </div>
            );
          })}
        </div>
      </section>

      <Card>
        <CardHeader
          title={selected ? `${selected} captures` : "All captures"}
          description={
            selected
              ? `Showing ${filteredItems.length} items in ${selected}.`
              : "Tap a cluster above to filter."
          }
          right={
            selected ? (
              <button
                onClick={() => setSelected(null)}
                className="inline-flex items-center gap-1 rounded-full border border-line-soft px-2.5 py-1 text-xs text-ink-soft hover:text-ink"
              >
                <X className="h-3 w-3" /> Clear filter
              </button>
            ) : (
              <Badge tone="muted">{filteredItems.length}</Badge>
            )
          }
        />
        {filteredItems.length === 0 ? (
          <p className="text-sm text-ink-mute">No captures in this cluster yet.</p>
        ) : (
          <ul className="grid gap-2 md:grid-cols-2">
            {filteredItems.slice(0, 40).map((it) => (
              <li
                key={it.id}
                className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5"
              >
                <Link
                  href={`/inbox?focus=${it.id}`}
                  className="text-sm text-ink hover:text-accent"
                >
                  {it.title}
                </Link>
                <div className="mt-0.5 text-xs text-ink-mute">
                  {it.sourcePlatform}
                  {!selected ? ` · ${it.category}` : ""}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Insights"
          description="What the clusters tell you"
          right={<Sparkles className="h-5 w-5 text-accent" />}
        />
        <ul className="space-y-2 text-sm text-ink-soft">
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-3">
            <Filter className="mr-1 inline h-3.5 w-3.5 text-accent" /> {totalProcessed}{" "}
            processed captures · clusters above 3 items are candidates for build packs.
          </li>
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-3">
            <Network className="mr-1 inline h-3.5 w-3.5 text-accent" /> Click any bubble
            to drill into that cluster — open an item to triage it in your inbox.
          </li>
        </ul>
      </Card>
    </div>
  );
}

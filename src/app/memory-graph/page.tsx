import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { listItems } from "@/lib/queries";
import { Network, Filter, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

const CLUSTER_ORDER = [
  "AI Agents",
  "Job Automation",
  "UI Inspiration",
  "Data Science",
  "Prompt Engineering",
  "Full-stack Projects",
  "Learning Resources",
  "Content Ideas",
];

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

export default async function MemoryGraphPage() {
  const items = await listItems({ limit: 500 });
  const clusters: Record<string, typeof items> = {};
  for (const cat of CLUSTER_ORDER) clusters[cat] = [];
  for (const it of items) {
    const c = it.category ?? "General";
    if (!clusters[c]) clusters[c] = [];
    clusters[c].push(it);
  }
  const totalProcessed = items.filter((i) => i.isProcessed).length;

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Memory graph</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Your saved memory, <span className="text-accent">clustered by purpose</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          Each cluster bubble shows a category and the captures inside it. Bigger bubbles mean
          higher concentration — these are your latent project ideas.
        </p>
      </header>

      <section className="panel relative overflow-hidden p-6">
        <div className="absolute inset-0 -z-10 opacity-60" style={{ background: "radial-gradient(circle at 30% 20%, rgba(124,156,255,0.18), transparent 60%)" }} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {CLUSTER_ORDER.map((cat) => {
            const list = clusters[cat] ?? [];
            const size = Math.min(180, 80 + list.length * 14);
            const tone = CLUSTER_TONE[cat] ?? "muted";
            return (
              <div key={cat} className="flex flex-col items-center gap-3">
                <div
                  className="relative grid place-items-center rounded-full border border-accent/30 bg-accent/[0.08] text-center"
                  style={{ width: size, height: size }}
                >
                  <div>
                    <div className="text-2xl font-semibold text-ink">{list.length}</div>
                    <div className="px-3 text-[10px] uppercase tracking-[0.18em] text-ink-mute">
                      {cat}
                    </div>
                  </div>
                  <div className="absolute inset-0 rounded-full" style={{ boxShadow: "0 0 60px -10px rgba(124,156,255,0.35) inset" }} />
                </div>
                <Badge tone={tone}>{cat}</Badge>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {CLUSTER_ORDER.filter((c) => (clusters[c] ?? []).length > 0).map((cat) => (
          <Card key={cat}>
            <CardHeader
              title={cat}
              right={<Badge tone={CLUSTER_TONE[cat] ?? "muted"}>{clusters[cat].length}</Badge>}
            />
            <ul className="space-y-2">
              {clusters[cat].slice(0, 5).map((it) => (
                <li key={it.id} className="rounded-lg border border-line-soft bg-bg-soft/40 p-2.5">
                  <Link href="/inbox" className="text-sm text-ink hover:text-accent">
                    {it.title}
                  </Link>
                  <div className="mt-0.5 text-xs text-ink-mute">{it.sourcePlatform}</div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader
          title="Insights"
          description="What the clusters tell you"
          right={<Sparkles className="h-5 w-5 text-accent" />}
        />
        <ul className="space-y-2 text-sm text-ink-soft">
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-3">
            <Filter className="mr-1 inline h-3.5 w-3.5 text-accent" /> {totalProcessed} processed captures · clusters above 3 items are candidates for build packs.
          </li>
          <li className="rounded-lg border border-line-soft bg-bg-soft/40 p-3">
            <Network className="mr-1 inline h-3.5 w-3.5 text-accent" /> Your two largest clusters cross-link well — the MCP agent video + RAG repo are likely the same project.
          </li>
        </ul>
      </Card>
    </div>
  );
}

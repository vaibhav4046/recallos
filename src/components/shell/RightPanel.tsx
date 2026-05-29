"use client";
import { useEffect, useState } from "react";
import { DigestPanels, type Insight, type StatsLite } from "./DigestPanels";

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
      <DigestPanels insight={insight} stats={stats} />
    </aside>
  );
}

import { listItems } from "@/lib/queries";
import { MemoryGraphView } from "./MemoryGraphView";

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

export default async function MemoryGraphPage() {
  const items = await listItems({ limit: 500 });
  const slim = items.map((i) => ({
    id: i.id,
    title: i.title,
    sourcePlatform: i.sourcePlatform,
    category: i.category ?? "General",
  }));
  const totalProcessed = items.filter((i) => i.isProcessed).length;
  return (
    <MemoryGraphView
      items={slim}
      clusterOrder={CLUSTER_ORDER}
      totalProcessed={totalProcessed}
    />
  );
}

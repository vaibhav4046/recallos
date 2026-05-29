"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { X, Sparkles } from "lucide-react";
import { DigestPanels, type Insight, type StatsLite } from "./DigestPanels";

/**
 * Mobile/tablet (<xl) counterpart to RightPanel. The desktop digest aside is
 * hidden below xl, so this slide-over keeps the daily digest reachable behind a
 * TopBar button (the "musemint:mobile-digest" event). Data is fetched lazily on
 * first open to avoid a request on every page load.
 */
export function MobileDigest() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [stats, setStats] = useState<StatsLite | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    document.addEventListener("musemint:mobile-digest", onOpen);
    return () => document.removeEventListener("musemint:mobile-digest", onOpen);
  }, []);

  // Close on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Lazy-load digest data the first time the drawer opens.
  useEffect(() => {
    if (!open || loaded) return;
    setLoaded(true);
    fetch("/api/digest")
      .then((r) => r.json())
      .then((j) => setInsight(j))
      .catch(() => setInsight(null));
    fetch("/api/stats")
      .then((r) => r.json())
      .then((j) => setStats(j))
      .catch(() => setStats(null));
  }, [open, loaded]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 xl:hidden">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-y-0 right-0 flex w-[88%] max-w-sm flex-col gap-4 overflow-y-auto border-l border-line/70 bg-bg-panel/95 p-4 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-accent" />
            <span>Daily digest</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="btn-icon h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>
        <DigestPanels insight={insight} stats={stats} />
      </div>
    </div>
  );
}

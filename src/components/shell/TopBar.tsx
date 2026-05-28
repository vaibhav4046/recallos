"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search, Command, Plus, Bell, Sparkles, Menu } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SearchHit {
  id: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  sourcePlatform: string;
}

export function TopBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function runSearch(value: string) {
    setQ(value);
    if (!value.trim()) {
      setHits(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
      const json = await res.json();
      setHits(json.items ?? []);
    } finally {
      setLoading(false);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          aria-label="Open menu"
          className="btn-icon md:hidden"
          onClick={() => document.dispatchEvent(new CustomEvent("recallos:mobile-nav"))}
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative max-w-2xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            type="text"
            value={q}
            onChange={(e) => runSearch(e.target.value)}
            placeholder="Search memory, prompts, projects…"
            className="h-9 w-full rounded-lg border border-line bg-bg-soft/60 pl-9 pr-16 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/60"
            aria-label="Search"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-ink-mute">
            <span className="kbd">
              <Command className="h-3 w-3" />K
            </span>
          </span>
          {hits !== null ? (
            <div className="absolute left-0 right-0 top-full mt-2 panel max-h-80 overflow-auto p-2">
              {loading ? (
                <div className="px-3 py-2 text-sm text-ink-mute">Searching…</div>
              ) : hits.length === 0 ? (
                <div className="px-3 py-2 text-sm text-ink-mute">No matches</div>
              ) : (
                hits.map((h) => (
                  <Link
                    key={h.id}
                    href={`/inbox?focus=${h.id}`}
                    onClick={() => {
                      setHits(null);
                      setQ("");
                    }}
                    className="flex flex-col gap-0.5 rounded-md px-3 py-2 hover:bg-bg-soft/80"
                  >
                    <span className="text-sm text-ink">{h.title}</span>
                    <span className="text-xs text-ink-mute">
                      {h.sourcePlatform}
                      {h.category ? ` · ${h.category}` : ""}
                    </span>
                  </Link>
                ))
              )}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/reminders" className="btn-icon" aria-label="Reminders">
            <Bell className="h-4 w-4" />
          </Link>
          <Link href="/inbox" className="btn-ghost hidden md:inline-flex">
            <Sparkles className="h-4 w-4" />
            <span>Today's digest</span>
          </Link>
          <Button
            onClick={() => router.push("/capture")}
            variant="primary"
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Capture</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

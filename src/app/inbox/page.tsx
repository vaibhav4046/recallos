"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ItemCard } from "@/components/ItemCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { Filter, Inbox as InboxIcon, ListFilter, Search } from "lucide-react";

export const dynamic = "force-dynamic";

type Item = {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  sourcePlatform: string;
  url: string | null;
  createdAt: string;
  tags: string[];
  status: string;
  nextAction: string | null;
  scores: {
    usefulness: number;
    actionability: number;
    portfolioValue: number;
    confidence: number;
  };
};

const STATUSES = [
  { key: "inbox", label: "Inbox" },
  { key: "kept", label: "Kept" },
  { key: "archived", label: "Archived" },
] as const;

export default function InboxPage() {
  const toast = useToast();
  const sp = useSearchParams();
  const focusId = sp.get("focus");
  const [items, setItems] = useState<Item[] | null>(null);
  const [filter, setFilter] = useState<string>("inbox");
  const [category, setCategory] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [focused, setFocused] = useState<string | null>(focusId);
  const focusHandled = useRef<string | null>(null);

  async function load() {
    const res = await fetch(`/api/items?status=${filter}`);
    const json = await res.json();
    setItems(json.items);
  }

  useEffect(() => {
    setItems(null);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // A search result can point at an item in any status. Look up the focused
  // item, switch to its tab so it's actually visible, then highlight + scroll.
  useEffect(() => {
    if (!focusId || focusHandled.current === focusId) return;
    focusHandled.current = focusId;
    setFocused(focusId);
    (async () => {
      try {
        const res = await fetch(`/api/items/${focusId}`);
        if (!res.ok) return;
        const json = await res.json();
        const status = json?.item?.status;
        if (status && ["inbox", "kept", "archived"].includes(status)) {
          setFilter(status);
        }
      } catch {
        /* best-effort focus */
      }
    })();
  }, [focusId]);

  // Once the focused card is in the DOM, scroll to it and fade the highlight.
  useEffect(() => {
    if (!focused || items === null) return;
    const el = document.querySelector<HTMLElement>(`[data-item-id="${focused}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const t = setTimeout(() => setFocused(null), 2600);
    return () => clearTimeout(t);
  }, [focused, items]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((i) => i.category && set.add(i.category));
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    return (items ?? []).filter((i) => {
      if (category && i.category !== category) return false;
      if (q) {
        const haystack = `${i.title} ${i.summary ?? ""} ${i.tags.join(" ")}`.toLowerCase();
        if (!haystack.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, category, q]);

  async function patch(id: string, body: any) {
    const res = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error("Action failed");
    return res.json();
  }

  async function onAction(id: string, action: "keep" | "archive" | "project" | "prompt" | "reminder") {
    try {
      if (action === "keep") {
        await patch(id, { status: "kept" });
        toast({ kind: "success", title: "Kept", body: "Moved to kept memory." });
      } else if (action === "archive") {
        await patch(id, { status: "archived" });
        toast({ kind: "success", title: "Archived" });
      } else if (action === "project") {
        toast({
          kind: "info",
          title: "Generating project brief",
          body: "Musemint is scoring portfolio value and drafting the brief…",
        });
        const res = await fetch(`/api/items/${id}/project`, { method: "POST" });
        if (!res.ok) throw new Error("Could not spawn project");
        toast({
          kind: "success",
          title: "Project brief ready",
          body: "Opened in Ready to Build — generate the full build pack next.",
        });
      } else if (action === "prompt") {
        const item = (items ?? []).find((i) => i.id === id);
        if (!item) return;
        await fetch("/api/prompts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: item.title,
            body: item.summary ?? item.title,
            category: item.category ?? "general",
            tags: item.tags,
          }),
        });
        toast({ kind: "success", title: "Saved as prompt" });
      } else if (action === "reminder") {
        const item = (items ?? []).find((i) => i.id === id);
        if (!item) return;
        await fetch("/api/reminders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Revisit: ${item.title}`,
            kind: "forgotten",
            dueAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
            itemId: item.id,
          }),
        });
        toast({ kind: "success", title: "Reminder added" });
      }
      load();
    } catch (err: any) {
      toast({ kind: "error", title: "Action failed", body: err.message });
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="field-label">AI Inbox</div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Triage in seconds — Musemint already did the heavy lift.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            Each card is scored for usefulness, actionability, and portfolio value.
            Keep, archive, promote to project, or send to your prompt library.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <button
              key={s.key}
              onClick={() => setFilter(s.key)}
              className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                filter === s.key
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-line-soft text-ink-soft hover:text-ink"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </header>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Filter by title, tag, summary…"
              className="input pl-9"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-ink-mute">
              <ListFilter className="h-3.5 w-3.5" /> Category
            </span>
            <button
              onClick={() => setCategory(null)}
              className={`rounded-full px-3 py-1 text-xs ${!category ? "bg-accent/15 text-accent" : "text-ink-soft hover:text-ink"}`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c === category ? null : c)}
                className={`rounded-full px-3 py-1 text-xs ${category === c ? "bg-accent/15 text-accent" : "text-ink-soft hover:text-ink"}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {items === null ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="panel h-64 shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-5 w-5" />}
          title="Inbox is clean"
          description={
            filter === "inbox"
              ? "Nothing left to triage. Capture something or open Ready to Build."
              : "No items in this view yet."
          }
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filtered.map((item) => (
            <div
              key={item.id}
              data-item-id={item.id}
              className={`rounded-2xl transition-all duration-500 ${
                focused === item.id
                  ? "ring-2 ring-accent/70 ring-offset-2 ring-offset-bg"
                  : "ring-0"
              }`}
            >
              <ItemCard
                item={{ ...item, createdAt: item.createdAt }}
                onAction={(a) => onAction(item.id, a)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

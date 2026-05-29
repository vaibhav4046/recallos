"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Command, Plus, Bell, Sparkles, Menu, Brain, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SearchHit {
  id: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  sourcePlatform: string;
  score?: number;
}

export function TopBar() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const seqRef = useRef(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [semantic, setSemantic] = useState(false);
  const [active, setActive] = useState(0);
  // Mode reflects what the server actually ran (semantic can silently fall back
  // to keyword), and notice surfaces transient states like rate-limiting.
  const [mode, setMode] = useState<"keyword" | "semantic">("keyword");
  const [notice, setNotice] = useState<string | null>(null);

  const runSearch = useCallback(
    async (value: string, useSemantic: boolean) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setHits(null);
        setLoading(false);
        return;
      }
      const seq = ++seqRef.current;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}${useSemantic ? "&semantic=1" : ""}`,
        );
        // Drop stale responses — only the latest query wins.
        if (seq !== seqRef.current) return;
        if (res.status === 429) {
          // Don't masquerade rate-limiting as "no results".
          setHits([]);
          setNotice("Searching too fast — give it a second.");
          setActive(0);
          return;
        }
        const json = await res.json();
        if (seq !== seqRef.current) return;
        setHits(json.items ?? []);
        setMode(json.mode === "semantic" ? "semantic" : "keyword");
        setNotice(null);
        setActive(0);
      } catch {
        if (seq === seqRef.current) {
          setHits([]);
          setNotice("Search failed — try again.");
        }
      } finally {
        if (seq === seqRef.current) setLoading(false);
      }
    },
    [],
  );

  // Debounced search on query / mode change.
  const schedule = useCallback(
    (value: string, useSemantic: boolean) => {
      setQ(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (!value.trim()) {
        setHits(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      debounceRef.current = setTimeout(() => runSearch(value, useSemantic), 220);
    },
    [runSearch],
  );

  // Global Cmd/Ctrl-K focuses the search box.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        inputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function close() {
    setHits(null);
    setQ("");
    setActive(0);
    setNotice(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  function go(hit: SearchHit) {
    close();
    inputRef.current?.blur();
    router.push(`/inbox?focus=${hit.id}`);
  }

  function toggleSemantic() {
    const next = !semantic;
    setSemantic(next);
    if (q.trim()) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      setLoading(true);
      runSearch(q, next);
    }
  }

  function onInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      close();
      inputRef.current?.blur();
      return;
    }
    if (!hits || hits.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % hits.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i - 1 + hits.length) % hits.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = hits[active] ?? hits[0];
      if (hit) go(hit);
    }
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-bg/80 backdrop-blur-md">
      <div className="flex h-14 items-center gap-3 px-4">
        <button
          aria-label="Open menu"
          className="btn-icon md:hidden"
          onClick={() => document.dispatchEvent(new CustomEvent("musemint:mobile-nav"))}
        >
          <Menu className="h-4 w-4" />
        </button>
        <div className="relative max-w-2xl flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-mute" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => schedule(e.target.value, semantic)}
            onKeyDown={onInputKeyDown}
            placeholder={semantic ? "Ask by meaning — 'that AI agent video'…" : "Search memory, prompts, projects…"}
            className="h-9 w-full rounded-lg border border-line bg-bg-soft/60 pl-9 pr-28 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/60"
            aria-label="Search"
            role="combobox"
            aria-expanded={hits !== null}
            aria-controls="topbar-search-results"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <button
              type="button"
              onClick={toggleSemantic}
              title={semantic ? "Semantic search on — match by meaning" : "Keyword search — click for semantic"}
              aria-pressed={semantic}
              aria-label="Toggle semantic search"
              className={`inline-flex h-6 items-center gap-1 rounded-md border px-1.5 text-[11px] transition-colors ${
                semantic
                  ? "border-accent/50 bg-accent/15 text-accent"
                  : "border-line-soft text-ink-mute hover:text-ink-soft"
              }`}
            >
              <Brain className="h-3 w-3" />
              <span className="hidden sm:inline">AI</span>
            </button>
            <span className="pointer-events-none hidden items-center gap-1 text-ink-mute sm:flex">
              <span className="kbd">
                <Command className="h-3 w-3" />K
              </span>
            </span>
          </span>
          {hits !== null ? (
            <div
              id="topbar-search-results"
              role="listbox"
              className="absolute left-0 right-0 top-full mt-2 panel max-h-96 overflow-auto p-2"
            >
              <div className="flex items-center justify-between px-2 pb-1.5 text-[11px] text-ink-faint">
                <span>
                  {mode === "semantic" ? "Semantic matches" : "Keyword matches"}
                  {semantic && mode === "keyword" ? " · semantic unavailable" : ""}
                </span>
                {!loading && hits.length > 0 ? (
                  <span className="hidden sm:inline">↑↓ to move · ↵ to open · esc to close</span>
                ) : null}
              </div>
              {loading ? (
                <div className="px-3 py-2 text-sm text-ink-mute">Searching…</div>
              ) : notice ? (
                <div className="px-3 py-2 text-sm text-ink-mute">{notice}</div>
              ) : hits.length === 0 ? (
                <div className="px-3 py-2 text-sm text-ink-mute">
                  No matches{semantic ? " — try keyword search" : ""}
                </div>
              ) : (
                hits.map((h, i) => (
                  <button
                    key={h.id}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(h)}
                    className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${
                      i === active ? "bg-accent/10" : "hover:bg-bg-soft/80"
                    }`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ink">{h.title}</span>
                      <span className="block truncate text-xs text-ink-mute">
                        {h.sourcePlatform}
                        {h.category ? ` · ${h.category}` : ""}
                      </span>
                    </span>
                    {typeof h.score === "number" ? (
                      <span
                        className="shrink-0 rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent"
                        title="Semantic similarity"
                      >
                        {Math.round(h.score * 100)}%
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Open daily digest"
            title="Daily digest"
            className="btn-icon xl:hidden"
            onClick={() => document.dispatchEvent(new CustomEvent("musemint:mobile-digest"))}
          >
            <PanelRight className="h-4 w-4" />
          </button>
          <Link href="/reminders" className="btn-icon hidden sm:inline-flex" aria-label="Reminders">
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
            aria-label="Capture"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Capture</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

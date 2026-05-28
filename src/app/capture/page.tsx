"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Youtube,
  Linkedin,
  Instagram,
  Github,
  Link2,
  StickyNote,
  ImagePlus,
  Sparkles,
  ArrowRight,
  Wand2,
} from "lucide-react";

const KINDS = [
  { key: "url", label: "Link / Article", icon: Link2, hint: "Any web URL" },
  { key: "youtube", label: "YouTube", icon: Youtube, hint: "Watch later or saved" },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin, hint: "Post URL or share" },
  { key: "instagram", label: "Instagram", icon: Instagram, hint: "Reel / post URL" },
  { key: "github", label: "GitHub Repo", icon: Github, hint: "Starred or saved" },
  { key: "note", label: "Note", icon: StickyNote, hint: "Plain text" },
  { key: "prompt", label: "Prompt", icon: Sparkles, hint: "AI prompt" },
  { key: "screenshot", label: "Screenshot", icon: ImagePlus, hint: "Drop image" },
];

const INTENTS = [
  { key: "auto", label: "Auto-decide with AI" },
  { key: "remember", label: "Just remember it" },
  { key: "project", label: "Turn into project idea" },
  { key: "prompt", label: "Save as prompt" },
  { key: "learn", label: "Add to learning queue" },
  { key: "jobsearch", label: "Add to job-search vault" },
  { key: "reminder", label: "Create reminder" },
  { key: "summarize", label: "Summarize only" },
];

export default function CapturePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const [kind, setKind] = useState<string>(sp.get("kind") ?? "url");
  const [url, setUrl] = useState(sp.get("url") ?? "");
  const [title, setTitle] = useState("");
  const [rawContent, setRawContent] = useState("");
  const [intent, setIntent] = useState("auto");
  const [submitting, setSubmitting] = useState(false);
  const [process, setProcess] = useState(true);
  const [screenshot, setScreenshot] = useState<string | null>(null);

  useEffect(() => {
    const k = sp.get("kind");
    if (k) setKind(k);
  }, [sp]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        kind,
        intent,
        title: title || undefined,
        url: url || undefined,
        rawContent: rawContent || undefined,
        process,
      };
      if (kind === "screenshot" && screenshot) {
        payload.rawContent = `Screenshot OCR placeholder · base64 length ${screenshot.length}`;
      }
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Capture failed");
      }
      toast({
        kind: "success",
        title: "Captured",
        body: "RecallOS processed it and dropped it into your inbox.",
      });
      router.push("/inbox");
    } catch (err: any) {
      toast({ kind: "error", title: "Capture failed", body: err.message });
    } finally {
      setSubmitting(false);
    }
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!title) setTitle(file.name);
    const reader = new FileReader();
    reader.onload = () => setScreenshot(String(reader.result ?? ""));
    reader.readAsDataURL(file);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <div className="field-label">Universal capture</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink text-balance">
          Drop in <span className="text-accent">anything</span> — RecallOS makes it useful.
        </h1>
        <p className="mt-2 text-sm text-ink-mute">
          Share sheet, browser extension, screenshot OCR, or paste — every input
          becomes a structured CapturedItem with AI scoring.
        </p>
      </header>

      <Card>
        <CardHeader title="What are you saving?" right={<Badge tone="accent">Step 1</Badge>} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {KINDS.map((k) => {
            const Icon = k.icon;
            const active = kind === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                className={`group flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-colors ${
                  active
                    ? "border-accent/50 bg-accent/[0.07]"
                    : "border-line-soft bg-bg-soft/40 hover:border-line"
                }`}
                aria-pressed={active}
              >
                <Icon className={`h-4 w-4 ${active ? "text-accent" : "text-ink-mute"}`} />
                <div>
                  <div className="text-sm font-medium text-ink">{k.label}</div>
                  <div className="text-xs text-ink-mute">{k.hint}</div>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardHeader title="Details" right={<Badge tone="accent">Step 2</Badge>} />
        <form onSubmit={onSubmit} className="space-y-4">
          {kind !== "note" && kind !== "prompt" && kind !== "screenshot" ? (
            <div>
              <label className="field-label">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://"
                className="input mt-1"
                aria-label="URL"
              />
            </div>
          ) : null}

          {kind === "screenshot" ? (
            <div>
              <label className="field-label">Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={onFile}
                className="mt-1 block w-full rounded-lg border border-dashed border-line bg-bg-soft/40 px-3 py-6 text-sm text-ink-soft file:mr-3 file:rounded-md file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-[#0a1530]"
              />
              {screenshot ? (
                <p className="mt-2 text-xs text-ink-mute">Image attached — RecallOS will OCR + summarize.</p>
              ) : null}
            </div>
          ) : null}

          <div>
            <label className="field-label">Title (optional)</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A short title — auto-derived if blank"
              className="input mt-1"
              aria-label="Title"
            />
          </div>

          {kind === "note" || kind === "prompt" ? (
            <div>
              <label className="field-label">{kind === "prompt" ? "Prompt body" : "Note body"}</label>
              <textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={6}
                placeholder={
                  kind === "prompt"
                    ? "Write a SaaS landing for a [product] aimed at [audience]…"
                    : "Type or paste your note…"
                }
                className="input mt-1 min-h-[8rem]"
              />
            </div>
          ) : (
            <div>
              <label className="field-label">Notes (optional)</label>
              <textarea
                value={rawContent}
                onChange={(e) => setRawContent(e.target.value)}
                rows={3}
                placeholder="Add any context — why you saved it, what to do with it…"
                className="input mt-1"
              />
            </div>
          )}

          <div>
            <label className="field-label">Intent</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTENTS.map((i) => (
                <button
                  type="button"
                  key={i.key}
                  onClick={() => setIntent(i.key)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    intent === i.key
                      ? "border-accent/50 bg-accent/15 text-accent"
                      : "border-line-soft text-ink-soft hover:text-ink"
                  }`}
                  aria-pressed={intent === i.key}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-line-soft bg-bg-soft/40 p-3">
            <div className="flex items-center gap-2 text-sm text-ink-soft">
              <Wand2 className="h-4 w-4 text-accent" />
              <span>Run AI processing now (classify, score, summarize)</span>
            </div>
            <label className="relative inline-flex h-5 w-9 cursor-pointer items-center">
              <input
                type="checkbox"
                checked={process}
                onChange={(e) => setProcess(e.target.checked)}
                className="peer sr-only"
              />
              <span className="h-5 w-9 rounded-full bg-bg-raised peer-checked:bg-accent/40" />
              <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-ink-soft transition-transform peer-checked:translate-x-4 peer-checked:bg-accent" />
            </label>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={submitting}>
              {submitting ? "Saving…" : (
                <>
                  Save to RecallOS <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

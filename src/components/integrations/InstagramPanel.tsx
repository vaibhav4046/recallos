"use client";
import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { Instagram, Loader2, Sparkles, ExternalLink } from "lucide-react";

type Status = {
  configured: boolean;
  connected: boolean;
  username: string | null;
  mediaCount: number;
};

type Pillar = { name: string; sharePct?: number };
type Idea = { title: string; why?: string };
type Analysis = {
  summary?: string;
  contentPillars?: Pillar[];
  voice?: string;
  whatWorks?: string[];
  gaps?: string[];
  buildableIdeas?: Idea[];
  raw?: string;
};

export function InstagramPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [postsAnalyzed, setPostsAnalyzed] = useState<number | null>(null);
  const toast = useToast();

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/integrations/instagram/status");
      setStatus(await res.json());
    } catch {
      setStatus({ configured: false, connected: false, username: null, mediaCount: 0 });
    }
  }, []);

  useEffect(() => {
    load();
    // Surface the OAuth redirect outcome (?ig=connected|denied|state_mismatch|error).
    const ig = new URLSearchParams(window.location.search).get("ig");
    if (!ig) return;
    const map: Record<string, { kind: "success" | "error"; body: string }> = {
      connected: { kind: "success", body: "Instagram connected. Run an analysis below." },
      denied: { kind: "error", body: "Authorization was declined." },
      state_mismatch: { kind: "error", body: "Security check failed — please retry." },
      not_configured: { kind: "error", body: "Instagram app credentials are not set." },
      error: { kind: "error", body: "Connection failed. Please retry." },
    };
    const m = map[ig];
    if (m) toast({ kind: m.kind, title: "Instagram", body: m.body });
    window.history.replaceState({}, "", "/integrations");
  }, [load, toast]);

  async function analyze() {
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/integrations/instagram/analyze", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Analysis failed");
      setAnalysis(json.analysis ?? null);
      setPostsAnalyzed(json.postsAnalyzed ?? 0);
      if (!json.analysis) toast({ kind: "info", title: "Instagram", body: "No posts found to analyze." });
    } catch (err: any) {
      toast({ kind: "error", title: "Analysis failed", body: err.message });
    } finally {
      setAnalyzing(false);
    }
  }

  if (status === null) return <div className="panel h-40 shimmer" />;

  return (
    <Card className="space-y-4">
      <CardHeader
        title={
          <span className="flex items-center gap-2">
            <Instagram className="h-5 w-5 text-[#ff9ad1]" /> Instagram analysis
          </span>
        }
        description="Official Instagram Graph API — your own Business/Creator account, no scraping."
        right={
          status.connected ? (
            <Badge tone="success">@{status.username}</Badge>
          ) : status.configured ? (
            <Badge tone="accent">Ready to connect</Badge>
          ) : (
            <Badge tone="warn">Needs setup</Badge>
          )
        }
      />

      {!status.configured ? (
        <div className="space-y-2 text-sm text-ink-mute">
          <p>To enable, create a Meta app and set these on the server:</p>
          <div className="rounded-lg border border-line-soft bg-bg-soft/40 p-3 font-mono text-xs text-ink-soft">
            <div>INSTAGRAM_APP_ID</div>
            <div>INSTAGRAM_APP_SECRET</div>
          </div>
          <a
            href="https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-accent hover:underline"
          >
            Meta setup guide <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
      ) : !status.connected ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-mute">
            Authorize your Business/Creator account to analyze your posts.
          </p>
          <a href="/api/integrations/instagram/connect" className="btn-primary shrink-0">
            <Instagram className="h-4 w-4" /> Connect Instagram
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-ink-mute">
              {status.mediaCount} posts · connected
            </span>
            <Button variant="primary" onClick={analyze} disabled={analyzing}>
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Analyze my content
                </>
              )}
            </Button>
          </div>

          {analysis ? (
            <div className="space-y-4 border-t border-line-soft pt-4">
              {analysis.summary ? (
                <p className="text-sm text-ink-soft">{analysis.summary}</p>
              ) : null}
              {postsAnalyzed != null ? (
                <div className="field-label">Based on {postsAnalyzed} recent posts</div>
              ) : null}

              {analysis.contentPillars?.length ? (
                <div>
                  <div className="field-label mb-1.5">Content pillars</div>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.contentPillars.map((p, i) => (
                      <Badge key={i} tone="muted">
                        {p.name}
                        {typeof p.sharePct === "number" ? ` · ${p.sharePct}%` : ""}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : null}

              {analysis.voice ? (
                <div>
                  <div className="field-label mb-1">Voice</div>
                  <p className="text-sm text-ink-soft">{analysis.voice}</p>
                </div>
              ) : null}

              {analysis.whatWorks?.length ? (
                <div>
                  <div className="field-label mb-1">What works</div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    {analysis.whatWorks.map((w, i) => (
                      <li key={i}>{w}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {analysis.gaps?.length ? (
                <div>
                  <div className="field-label mb-1">Gaps</div>
                  <ul className="list-disc space-y-1 pl-5 text-sm text-ink-soft">
                    {analysis.gaps.map((g, i) => (
                      <li key={i}>{g}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {analysis.buildableIdeas?.length ? (
                <div>
                  <div className="field-label mb-1.5">Buildable ideas</div>
                  <div className="space-y-2">
                    {analysis.buildableIdeas.map((idea, i) => (
                      <div key={i} className="panel-soft p-3">
                        <div className="text-sm font-medium text-ink">{idea.title}</div>
                        {idea.why ? (
                          <div className="mt-0.5 text-xs text-ink-mute">{idea.why}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {analysis.raw ? (
                <pre className="overflow-x-auto rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-xs text-ink-soft">
                  {analysis.raw}
                </pre>
              ) : null}
            </div>
          ) : null}
        </div>
      )}
    </Card>
  );
}

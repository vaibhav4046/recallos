"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import {
  Bot,
  Database,
  Download,
  KeyRound,
  Lock,
  PlugZap,
  ShieldCheck,
  Trash2,
} from "lucide-react";

interface KeyStatus {
  provider: string;
  configured: boolean;
}

const PROVIDER_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic Claude",
  groq: "Groq",
  mistral: "Mistral",
  youtube: "YouTube enrichment",
  mock: "Offline (built-in)",
};

export default function SettingsPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<KeyStatus[] | null>(null);
  const [localFirst, setLocalFirst] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string>("mock");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        setKeys(j.keys);
        setActiveProvider(j.active);
      });
  }, []);

  async function exportData() {
    window.location.href = "/api/export";
  }

  function openDeleteModal() {
    setDeletePhrase("");
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    setDeleting(true);
    try {
      const res = await fetch("/api/export", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE ALL MY DATA" }),
      });
      if (!res.ok) {
        toast({ kind: "error", title: "Wipe failed", body: "Please try again." });
        return;
      }
      toast({ kind: "success", title: "Memory wiped", body: "All captures, projects, and prompts are gone." });
      setShowDeleteModal(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Settings</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Privacy and AI <span className="text-accent">controls</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          Musemint is local-first. Pick your AI provider, export everything any time, and
          wipe memory on demand.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="AI providers"
            description="Musemint uses the first connected provider. Offline mode keeps everything on-device."
            right={
              <Badge tone={activeProvider === "mock" ? "muted" : "accent"}>
                <Bot className="h-3 w-3" />{" "}
                {activeProvider === "mock"
                  ? "Offline mode"
                  : `Live · ${PROVIDER_LABELS[activeProvider] ?? activeProvider}`}
              </Badge>
            }
          />
          <ul className="space-y-2">
            {(keys ?? []).map((k) => (
              <li
                key={k.provider}
                className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3"
              >
                <div className="flex items-center gap-3">
                  <KeyRound className={`h-4 w-4 ${k.configured ? "text-success" : "text-ink-mute"}`} />
                  <div>
                    <div className="text-sm font-semibold text-ink">
                      {PROVIDER_LABELS[k.provider] ?? k.provider}
                    </div>
                    <div className="text-xs text-ink-mute">
                      {k.configured
                        ? "Connected · credentials never leave this device"
                        : "Not connected"}
                    </div>
                  </div>
                </div>
                <Badge tone={k.configured ? "success" : "muted"}>
                  {k.configured ? "Connected" : "Available"}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-mute">
            Musemint will run fully offline using the built-in summarizer if no provider is connected.
            Connect a provider to upgrade quality — keys stay in your local environment.
          </p>
        </Card>

        <Card>
          <CardHeader
            title="Notifications"
            description="Lightweight nudges only — no notification fatigue."
          />
          <ul className="space-y-2 text-sm text-ink-soft">
            <li className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3">
              <span>Daily AI digest</span>
              <Badge tone="success">On</Badge>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3">
              <span>Forgotten gem nudges</span>
              <Badge tone="success">On</Badge>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3">
              <span>Build pack ready</span>
              <Badge tone="success">On</Badge>
            </li>
            <li className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3">
              <span>Mobile push (coming soon)</span>
              <Badge tone="muted">Off</Badge>
            </li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Privacy & local-first"
            description="Everything stays on your machine unless you opt in."
            right={<ShieldCheck className="h-5 w-5 text-success" />}
          />
          <div className="space-y-3 text-sm text-ink-soft">
            <label className="flex items-center justify-between rounded-lg border border-line-soft bg-bg-soft/40 p-3">
              <span className="inline-flex items-center gap-2">
                <Lock className="h-4 w-4 text-accent" /> Local-first mode
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="text-xs">{localFirst ? "On" : "Off"}</span>
                <input
                  type="checkbox"
                  checked={localFirst}
                  onChange={(e) => setLocalFirst(e.target.checked)}
                  className="h-4 w-7 accent-accent"
                />
              </span>
            </label>
            <p className="text-xs text-ink-mute">
              Disabling local-first lets Musemint optionally send captured text to your configured AI provider
              for processing. We never ship media unless you explicitly turn that on.
            </p>
          </div>
        </Card>

        <Card>
          <CardHeader title="Data sources" description="Where memory comes from" />
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>· Share sheet + browser extension</li>
            <li>· Screenshot OCR (local)</li>
            <li>· Pasted URLs and notes</li>
            <li>· GitHub starred sync (opt-in)</li>
            <li>· MCP / Telegram bot (coming soon)</li>
          </ul>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Export" description="Download everything as JSON" right={<Download className="h-5 w-5 text-accent" />} />
          <Button variant="primary" onClick={exportData}>
            <Download className="h-4 w-4" /> Download export
          </Button>
        </Card>
        <Card>
          <CardHeader title="Delete memory" description="Wipe captures, projects, prompts, reminders" right={<Trash2 className="h-5 w-5 text-danger" />} />
          <Button variant="danger" onClick={openDeleteModal}>
            <Trash2 className="h-4 w-4" /> Delete everything
          </Button>
        </Card>
        <Card>
          <CardHeader title="MCP server" description="Coming soon — expose memory as MCP tools" right={<PlugZap className="h-5 w-5 text-accent" />} />
          <Button disabled>
            <Database className="h-4 w-4" /> Start MCP server
          </Button>
        </Card>
      </section>

      {showDeleteModal ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !deleting && setShowDeleteModal(false)}
          />
          <div className="relative w-full max-w-md panel border-danger/40 bg-bg-raised/95 p-5 shadow-glow">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-danger/40 bg-danger/10 text-danger">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <h2 id="delete-modal-title" className="text-base font-semibold text-ink">
                  Delete all Musemint data?
                </h2>
                <p className="mt-1 text-sm text-ink-soft">
                  This permanently wipes every capture, project brief, prompt, reminder, and
                  build pack. Export first if you want a backup. This cannot be undone.
                </p>
              </div>
            </div>
            <label className="mt-4 block text-xs uppercase tracking-wider text-ink-mute">
              Type <span className="font-mono text-danger">DELETE</span> to confirm
            </label>
            <input
              type="text"
              autoFocus
              value={deletePhrase}
              onChange={(e) => setDeletePhrase(e.target.value)}
              placeholder="DELETE"
              className="input mt-1"
              aria-label="Type DELETE to confirm"
            />
            <div className="mt-5 flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={deletePhrase.trim() !== "DELETE" || deleting}
                onClick={confirmDelete}
              >
                <Trash2 className="h-4 w-4" />
                {deleting ? "Deleting…" : "Delete everything"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

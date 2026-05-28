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

export default function SettingsPage() {
  const toast = useToast();
  const [keys, setKeys] = useState<KeyStatus[] | null>(null);
  const [localFirst, setLocalFirst] = useState(true);
  const [activeProvider, setActiveProvider] = useState<string>("mock");

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
  async function deleteData() {
    const phrase = window.prompt(
      'This permanently wipes ALL captures, projects, prompts, and reminders. This cannot be undone.\n\nType "DELETE ALL MY DATA" to confirm:',
    );
    if (phrase !== "DELETE ALL MY DATA") {
      if (phrase !== null) {
        toast({ kind: "error", title: "Not wiped", body: "Confirmation phrase did not match." });
      }
      return;
    }
    const res = await fetch("/api/export", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: phrase }),
    });
    if (!res.ok) {
      toast({ kind: "error", title: "Wipe failed", body: "Please try again." });
      return;
    }
    toast({ kind: "success", title: "Memory wiped", body: "Run the seed script to restore demo data." });
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
            description="Musemint picks the first configured key. Mock provider runs fully offline."
            right={
              <Badge tone={activeProvider === "mock" ? "muted" : "accent"}>
                <Bot className="h-3 w-3" /> Active: {activeProvider}
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
                    <div className="text-sm font-semibold text-ink capitalize">{k.provider}</div>
                    <div className="text-xs text-ink-mute">
                      {k.configured ? "Key detected (value hidden)" : "Set the env variable to enable"}
                    </div>
                  </div>
                </div>
                <Badge tone={k.configured ? "success" : "muted"}>
                  {k.configured ? "Configured" : "Not set"}
                </Badge>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-ink-mute">
            Set <code className="rounded bg-bg-soft px-1 py-0.5">GOOGLE_API_KEY</code>,{" "}
            <code className="rounded bg-bg-soft px-1 py-0.5">OPENAI_API_KEY</code>,{" "}
            <code className="rounded bg-bg-soft px-1 py-0.5">ANTHROPIC_API_KEY</code>, or{" "}
            <code className="rounded bg-bg-soft px-1 py-0.5">GROQ_API_KEY</code> in{" "}
            <code className="rounded bg-bg-soft px-1 py-0.5">.env</code>.
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
          <Button variant="danger" onClick={deleteData}>
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
    </div>
  );
}

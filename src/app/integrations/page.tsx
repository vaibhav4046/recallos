"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import {
  Youtube,
  Linkedin,
  Instagram,
  Github,
  Chrome,
  Smartphone,
  Image as ImageIcon,
  FileText,
  HardDrive,
  Mail,
  Send,
  Server,
  Sparkles,
  Zap,
  Bot,
  Database,
} from "lucide-react";
import { ReactNode } from "react";

interface Integration {
  id: string;
  key: string;
  name: string;
  description: string;
  status: string;
}

const ICONS: Record<string, ReactNode> = {
  youtube: <Youtube className="h-5 w-5 text-[#ff6b6b]" />,
  linkedin: <Linkedin className="h-5 w-5 text-[#7aa8ff]" />,
  instagram: <Instagram className="h-5 w-5 text-[#ff9ad1]" />,
  github: <Github className="h-5 w-5 text-ink-soft" />,
  chrome: <Chrome className="h-5 w-5 text-warn" />,
  mobile: <Smartphone className="h-5 w-5 text-success" />,
  ocr: <ImageIcon className="h-5 w-5 text-accent" />,
  notion: <FileText className="h-5 w-5 text-ink-soft" />,
  gdrive: <HardDrive className="h-5 w-5 text-accent" />,
  gmail: <Mail className="h-5 w-5 text-[#ff9269]" />,
  telegram: <Send className="h-5 w-5 text-accent" />,
  mcp: <Server className="h-5 w-5 text-success" />,
  gemini: <Sparkles className="h-5 w-5 text-accent" />,
  groq: <Zap className="h-5 w-5 text-warn" />,
  mistral: <Bot className="h-5 w-5 text-[#ff9269]" />,
  neon: <Database className="h-5 w-5 text-success" />,
};

const STATUS_META: Record<string, { label: string; tone: "success" | "warn" | "danger" | "muted" | "accent" }> = {
  connected: { label: "Connected", tone: "success" },
  available: { label: "Available", tone: "accent" },
  needs_setup: { label: "Needs setup", tone: "warn" },
  coming_soon: { label: "Coming soon", tone: "muted" },
};

const ACTION_LABEL: Record<string, string> = {
  connected: "Disconnect",
  available: "Connect",
  needs_setup: "Configure",
  coming_soon: "Notify me",
};

const NEXT_STATUS: Record<string, string> = {
  connected: "available",
  available: "connected",
  needs_setup: "connected",
  coming_soon: "needs_setup",
};

export default function IntegrationsPage() {
  const [list, setList] = useState<Integration[] | null>(null);
  const toast = useToast();

  async function load() {
    const res = await fetch("/api/integrations");
    const json = await res.json();
    setList(json.integrations);
  }
  useEffect(() => {
    load();
  }, []);

  async function toggle(i: Integration) {
    const next = NEXT_STATUS[i.status] ?? i.status;
    const res = await fetch(`/api/integrations/${i.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (res.ok) {
      toast({ kind: "success", title: i.name, body: `Status → ${next.replace("_", " ")}` });
      load();
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="field-label">Integrations</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Bring your <span className="text-accent">memory sources</span> in.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          Instagram and LinkedIn saved posts are captured via the share sheet, browser extension,
          or screenshot OCR — RecallOS never scrapes private accounts.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {(list ?? []).map((i) => {
          const meta = STATUS_META[i.status] ?? STATUS_META.available;
          return (
            <Card key={i.id} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-bg-soft/60">
                  {ICONS[i.key] ?? <Server className="h-5 w-5 text-ink-mute" />}
                </div>
                <Badge tone={meta.tone}>{meta.label}</Badge>
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">{i.name}</div>
                <p className="mt-1 text-sm text-ink-mute">{i.description}</p>
              </div>
              <div className="mt-auto flex items-center justify-between text-xs text-ink-mute">
                <span>
                  {i.key === "linkedin" || i.key === "instagram"
                    ? "Share-sheet / OCR only"
                    : i.key === "github"
                      ? "Official API"
                      : "Local + opt-in"}
                </span>
                <Button size="sm" onClick={() => toggle(i)}>
                  {ACTION_LABEL[i.status] ?? "Action"}
                </Button>
              </div>
            </Card>
          );
        })}
        {list === null
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="panel h-40 shimmer" />
            ))
          : null}
      </div>

      <Card>
        <CardHeader title="Privacy" description="What RecallOS will and won't do" />
        <ul className="space-y-2 text-sm text-ink-soft">
          <li>· Captures live in your local SQLite DB by default. Bring your own AI key to enable cloud processing.</li>
          <li>· LinkedIn and Instagram saved posts are <strong className="text-ink">never scraped</strong>. Use the official share sheet, the Chrome extension, or screenshot OCR.</li>
          <li>· All integrations are opt-in and reversible from this page.</li>
          <li>· Export or wipe your memory any time from <a href="/settings" className="text-accent">Settings</a>.</li>
        </ul>
      </Card>
    </div>
  );
}

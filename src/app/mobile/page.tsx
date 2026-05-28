"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Smartphone,
  Share2,
  Instagram,
  Youtube,
  Check,
  Download,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Link2,
  Zap,
} from "lucide-react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export default function MobilePage() {
  const [installEvt, setInstallEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(Boolean(standalone));

    const onBIP = (e: Event) => {
      e.preventDefault();
      setInstallEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function doInstall() {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice.catch(() => undefined);
    setInstallEvt(null);
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="field-label flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5" /> Musemint on your phone
          </div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink text-balance">
            Save from Instagram with one <span className="text-accent">Share</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-mute">
            Install Musemint once. Then in Instagram, YouTube, or any app, tap{" "}
            <span className="text-ink-soft">Share → Musemint</span> — your post lands in your
            inbox, auto-classified and scored. No logins, no scraping.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2">
          {installed ? (
            <span className="btn inline-flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
              <Check className="h-4 w-4" /> Installed on this device
            </span>
          ) : installEvt ? (
            <button onClick={doInstall} className="btn-primary">
              <Download className="h-4 w-4" /> Install Musemint
            </button>
          ) : (
            <span className="chip">Open in Safari/Chrome on your phone to install</span>
          )}
          <Link href="/capture" className="btn-ghost justify-center">
            <Link2 className="h-4 w-4" /> Or paste a link
          </Link>
        </div>
      </header>

      {/* Primary flow: hero phone + steps */}
      <section className="grid gap-6 lg:grid-cols-[300px_1fr] lg:items-center">
        <div className="mx-auto">
          <PhoneFrame>
            <div className="space-y-3">
              <div className="rounded-2xl border border-line bg-bg-soft/60 p-3">
                <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-mute">
                  <Instagram className="h-3.5 w-3.5" /> Instagram · Reel
                </div>
                <div className="mt-1 text-sm text-ink">Build an AI agent in 10 minutes</div>
              </div>
              <div className="text-center text-[11px] uppercase tracking-wider text-ink-faint">
                Share sheet
              </div>
              <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-ink-mute">
                {["Messages", "WhatsApp", "Copy", "More"].map((a) => (
                  <div key={a} className="space-y-1">
                    <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl border border-line bg-bg-soft/60">
                      <Share2 className="h-4 w-4" />
                    </div>
                    <div>{a}</div>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-accent/40 bg-accent/15 p-3 shadow-glow">
                <div className="flex items-center gap-2 text-accent">
                  <Sparkles className="h-4 w-4" /> Musemint
                </div>
                <p className="mt-1 text-xs text-ink-soft">Tap to save, classify & score.</p>
              </div>
              <div className="rounded-2xl border border-success/40 bg-success/10 p-3">
                <div className="flex items-center gap-2 text-success">
                  <Check className="h-4 w-4" /> Saved to inbox
                </div>
                <div className="mt-1 text-xs text-ink-mute">Category · Usefulness · Next action</div>
              </div>
            </div>
          </PhoneFrame>
        </div>

        <ol className="space-y-3">
          {[
            {
              icon: Instagram,
              title: "Open the post or reel",
              body: "In Instagram, open the thing you want to keep.",
            },
            {
              icon: Share2,
              title: "Tap Share → Share to…",
              body: "Use the paper-plane / share icon to bring up your phone's share sheet.",
            },
            {
              icon: Sparkles,
              title: "Choose Musemint",
              body: "Musemint appears as a share target once installed. Tap it.",
            },
            {
              icon: Check,
              title: "It's in your inbox",
              body: "Musemint detects the platform, classifies, scores, and files it — instantly.",
            },
          ].map((s, i) => {
            const Icon = s.icon;
            return (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-xl border border-line-soft bg-bg-soft/40 p-4 transition-colors hover:border-line"
              >
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-ink-faint">
                      STEP {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-ink">{s.title}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-mute">{s.body}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* Install instructions per-platform */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Download className="h-4 w-4 text-accent" /> Install on iPhone (Safari)
          </div>
          <ol className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>1. Open <span className="text-ink">{origin || "this site"}</span> in Safari.</li>
            <li>2. Tap the <span className="text-ink">Share</span> button.</li>
            <li>3. Choose <span className="text-ink">Add to Home Screen</span>.</li>
            <li>4. Launch Musemint from your home screen — now it shows up in share sheets.</li>
          </ol>
        </div>
        <div className="panel p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Download className="h-4 w-4 text-accent" /> Install on Android (Chrome)
          </div>
          <ol className="mt-3 space-y-2 text-sm text-ink-soft">
            <li>1. Open <span className="text-ink">{origin || "this site"}</span> in Chrome.</li>
            <li>2. Tap the <span className="text-ink">Install</span> button above, or ⋮ menu.</li>
            <li>3. Choose <span className="text-ink">Install app</span> / Add to Home screen.</li>
            <li>4. Musemint now appears when you tap Share in any app.</li>
          </ol>
        </div>
      </section>

      {/* Power tip: iOS Shortcut */}
      <section className="panel p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Zap className="h-4 w-4 text-accent" /> Power tip — iOS Shortcut
        </div>
        <p className="mt-2 text-sm text-ink-mute">
          Prefer Apple Shortcuts? Create one that receives URLs from the share sheet and opens{" "}
          <code className="rounded bg-bg-soft px-1.5 py-0.5 text-xs text-ink-soft">
            {origin || "https://your-musemint"}/share?url=
          </code>
          followed by the shared link. Sharing from Instagram then routes straight through the
          Musemint capture pipeline.
        </p>
      </section>

      {/* Other sources */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { icon: Youtube, label: "YouTube", note: "Real title, channel, views via API" },
          { icon: Instagram, label: "Instagram", note: "Reels & posts via share sheet" },
          { icon: Link2, label: "Any link", note: "Articles, GitHub, LinkedIn, more" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center gap-3 rounded-xl border border-line-soft bg-bg-soft/40 p-3"
            >
              <Icon className="h-5 w-5 text-accent" />
              <div>
                <div className="text-sm font-medium text-ink">{s.label}</div>
                <div className="text-xs text-ink-mute">{s.note}</div>
              </div>
            </div>
          );
        })}
      </section>

      <div className="panel-soft flex items-start gap-3 p-4 text-sm text-ink-mute">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <p>
          Musemint never logs into Instagram or LinkedIn and never scrapes private data. Saved
          posts arrive only through the official share sheet, pasted links, or screenshot OCR —
          exactly the same as a human tap.
        </p>
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative h-[540px] w-[270px] rounded-[2.4rem] border border-line bg-bg-panel/60 p-3 shadow-panel">
      <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
      <div className="h-full w-full overflow-hidden rounded-[2rem] border border-line-soft bg-gradient-to-b from-bg-panel via-bg to-bg p-4">
        <div className="mt-6 flex items-center justify-between text-[10px] text-ink-mute">
          <span>9:41</span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-accent" /> Musemint
          </span>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}

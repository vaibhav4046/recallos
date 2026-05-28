import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, ScoreBar } from "@/components/ui/Badge";
import { Bell, Camera, CheckCircle2, Share2, Sparkles, Smartphone } from "lucide-react";

const SCREENS = [
  {
    name: "Share to RecallOS",
    description: "From any app's share sheet.",
    body: (
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-line bg-bg-soft/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-mute">From Safari</div>
          <div className="mt-1 text-sm text-ink">youtube.com · Build an AI Agent with MCP</div>
        </div>
        <div className="rounded-2xl border border-accent/30 bg-accent/10 p-3">
          <div className="flex items-center gap-2 text-accent">
            <Share2 className="h-4 w-4" /> Share to RecallOS
          </div>
          <p className="mt-1 text-xs text-ink-soft">
            Auto-detect platform, classify, score, and create a capture in your inbox.
          </p>
        </div>
        <button className="btn-primary w-full">Save to RecallOS</button>
      </div>
    ),
  },
  {
    name: "Save confirmation",
    description: "Tap-to-act result toast.",
    body: (
      <div className="space-y-3">
        <div className="rounded-2xl border border-success/40 bg-success/10 p-3">
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-4 w-4" /> Saved
          </div>
          <div className="mt-1 text-sm text-ink">Build an AI Agent with MCP</div>
          <div className="mt-1 text-xs text-ink-mute">Category: AI Agents · Usefulness 92 · Action 88</div>
        </div>
        <div className="rounded-2xl border border-line bg-bg-soft/60 p-3">
          <div className="text-[11px] uppercase tracking-wider text-ink-mute">Next action</div>
          <div className="mt-1 text-sm text-ink">Spec the agent + draft tool list</div>
        </div>
      </div>
    ),
  },
  {
    name: "AI category selection",
    description: "User override before saving.",
    body: (
      <div className="grid grid-cols-2 gap-2">
        {[
          "AI Agents",
          "Job Automation",
          "UI Inspiration",
          "Prompt Engineering",
          "Full-stack",
          "Learning",
        ].map((c, i) => (
          <button
            key={c}
            className={`rounded-xl border px-2.5 py-3 text-left text-xs ${
              i === 0 ? "border-accent/40 bg-accent/15 text-accent" : "border-line bg-bg-soft/60 text-ink-soft"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
    ),
  },
  {
    name: "Screenshot upload",
    description: "Tap-to-OCR for inspiration captures.",
    body: (
      <div className="space-y-3">
        <div className="grid h-32 place-items-center rounded-2xl border border-dashed border-line bg-bg-soft/60 text-ink-mute">
          <Camera className="h-6 w-6" />
        </div>
        <button className="btn-ghost w-full">
          <Camera className="h-4 w-4" /> Use camera
        </button>
        <button className="btn-primary w-full">
          <Sparkles className="h-4 w-4" /> Save + OCR
        </button>
      </div>
    ),
  },
  {
    name: "Reminder notification",
    description: "Native push preview.",
    body: (
      <div className="space-y-3">
        <div className="rounded-2xl border border-line bg-bg-soft/60 p-3 shadow-glow">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-mute">
            <Bell className="h-3.5 w-3.5 text-accent" /> Reminder · 9:30 AM
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">Watch saved MCP agent video</div>
          <div className="text-xs text-ink-mute">From your Forgotten Gems</div>
        </div>
        <div className="text-[11px] text-ink-mute">Native push · scheduled for 24h after save</div>
      </div>
    ),
  },
  {
    name: "Build pack ready",
    description: "AI is done — open and ship.",
    body: (
      <div className="space-y-3">
        <div className="rounded-2xl border border-accent/40 bg-accent/15 p-3 shadow-glow">
          <div className="flex items-center gap-2 text-accent text-[11px] uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Build pack ready
          </div>
          <div className="mt-1 text-sm font-semibold text-ink">AI job application automation agent</div>
          <div className="text-xs text-ink-mute">Portfolio 94 · 12 tasks · README drafted</div>
        </div>
        <button className="btn-primary w-full">Open build pack</button>
      </div>
    ),
  },
];

export default function MobilePage() {
  return (
    <div className="space-y-6">
      <header>
        <div className="field-label flex items-center gap-1.5">
          <Smartphone className="h-3.5 w-3.5" /> Mobile capture
        </div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          What RecallOS feels like on <span className="text-accent">mobile</span>.
        </h1>
        <p className="mt-2 max-w-xl text-sm text-ink-mute">
          A preview of the share-sheet, save-confirmation, OCR, and push flows. The native
          app will ship the iOS share extension and Android share target.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {SCREENS.map((s) => (
          <div key={s.name} className="flex flex-col items-center gap-3">
            <div className="text-[11px] uppercase tracking-[0.18em] text-ink-mute">{s.name}</div>
            <div className="relative">
              <div className="h-[520px] w-[260px] rounded-[2.4rem] border border-line bg-bg-panel/60 p-3 shadow-panel">
                <div className="absolute left-1/2 top-3 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
                <div className="h-full w-full overflow-hidden rounded-[2rem] border border-line-soft bg-gradient-to-b from-bg-panel via-bg to-bg p-4">
                  <div className="mt-6 flex items-center justify-between text-[10px] text-ink-mute">
                    <span>9:41</span>
                    <span>RecallOS</span>
                  </div>
                  <div className="mt-3 space-y-3">{s.body}</div>
                </div>
              </div>
            </div>
            <div className="text-xs text-ink-mute">{s.description}</div>
          </div>
        ))}
      </div>

      <div className="panel-soft p-4 text-sm text-ink-mute">
        Reminder: RecallOS never logs into Instagram or LinkedIn. Saved posts arrive via the
        official share sheet or screenshot OCR — same as a human tap.
      </div>
    </div>
  );
}

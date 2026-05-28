import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type Tone = "default" | "accent" | "success" | "warn" | "danger" | "muted";

const tones: Record<Tone, string> = {
  default: "text-ink-soft border-line-soft bg-bg-soft/60",
  accent: "text-accent border-accent/30 bg-accent/10",
  success: "text-success border-success/30 bg-success/10",
  warn: "text-warn border-warn/30 bg-warn/10",
  danger: "text-danger border-danger/30 bg-danger/10",
  muted: "text-ink-mute border-line-soft bg-bg-raised/60",
};

export function Badge({
  tone = "default",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function ScoreBar({
  label,
  value,
  tone = "accent",
}: {
  label: string;
  value: number;
  tone?: "accent" | "success" | "warn";
}) {
  const safe = Math.max(0, Math.min(100, value));
  const toneClass =
    tone === "success"
      ? "bg-success"
      : tone === "warn"
        ? "bg-warn"
        : "bg-accent";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px] uppercase tracking-wider text-ink-mute">
        <span>{label}</span>
        <span className="font-mono text-ink-soft">{safe}</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-bg-soft">
        <div
          className={cn("h-full rounded-full", toneClass)}
          style={{ width: `${safe}%` }}
        />
      </div>
    </div>
  );
}

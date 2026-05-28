import { cn } from "@/lib/utils";
import { ReactNode } from "react";

export function Card({
  className,
  children,
  as: As = "div",
  ...rest
}: {
  className?: string;
  children: ReactNode;
  as?: any;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <As className={cn("panel p-5", className)} {...rest}>
      {children}
    </As>
  );
}

export function CardHeader({
  title,
  description,
  right,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-start justify-between gap-4", className)}>
      <div>
        <h3 className="text-base font-semibold tracking-tight text-ink">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-ink-mute">{description}</p>
        ) : null}
      </div>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn("panel-soft p-4 transition-colors hover:border-line-strong")}>
      <div className="field-label">{label}</div>
      <div
        className={cn(
          "mt-1 text-2xl font-semibold tracking-tight",
          accent ? "text-accent" : "text-ink",
        )}
      >
        {value}
      </div>
      {hint ? <div className="mt-1 text-xs text-ink-mute">{hint}</div> : null}
    </div>
  );
}

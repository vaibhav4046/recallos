"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Inbox,
  Plus,
  Hammer,
  Sparkles,
  Network,
  GraduationCap,
  Briefcase,
  Megaphone,
  Bell,
  Plug,
  Settings,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/inbox", label: "AI Inbox", icon: Inbox },
  { href: "/capture", label: "Capture", icon: Plus },
  { href: "/ready-to-build", label: "Ready to Build", icon: Hammer },
  { href: "/memory-graph", label: "Memory Graph", icon: Network },
  { href: "/prompts", label: "Prompts", icon: Sparkles },
  { href: "/learning", label: "Learning Queue", icon: GraduationCap },
  { href: "/job-search", label: "Job Search Vault", icon: Briefcase },
  { href: "/content-studio", label: "Content Studio", icon: Megaphone },
  { href: "/reminders", label: "Reminders", icon: Bell },
];

const FOOTER = [
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [inbox, setInbox] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/stats")
      .then((r) => r.json())
      .then((j) => {
        if (alive) setInbox(typeof j?.inbox === "number" ? j.inbox : null);
      })
      .catch(() => {
        if (alive) setInbox(null);
      });
    return () => {
      alive = false;
    };
  }, [pathname]);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-2 border-r border-line/70 bg-bg-panel/40 px-3 py-4 backdrop-blur-md">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="relative grid h-8 w-8 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
          <span className="font-mono text-sm font-bold">M</span>
          <span className="pointer-events-none absolute inset-0 rounded-lg shadow-glow" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">Musemint</span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            Stop saving · start building
          </span>
        </div>
      </div>
      <nav className="mt-2 flex flex-col gap-0.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-accent/10 text-ink"
                  : "text-ink-soft hover:bg-bg-soft/60 hover:text-ink",
              )}
            >
              {active ? (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
              ) : null}
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-accent" : "text-ink-mute group-hover:text-ink-soft",
                )}
              />
              <span>{item.label}</span>
              {item.href === "/inbox" && inbox && inbox > 0 ? (
                <span className="ml-auto rounded-full bg-accent/15 px-1.5 text-[10px] font-semibold tabular-nums text-accent">
                  {inbox > 99 ? "99+" : inbox}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5">
        {FOOTER.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm",
                active ? "bg-bg-soft text-ink" : "text-ink-soft hover:bg-bg-soft/60 hover:text-ink",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-ink-mute")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <div className="mt-2 panel-soft px-3 py-2.5">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
            </span>
            Workspace
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            Personal workspace
          </div>
        </div>
      </div>
    </aside>
  );
}

"use client";
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
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col gap-2 border-r border-line/70 bg-bg-panel/40 px-3 py-4 backdrop-blur-md">
      <div className="flex items-center gap-2 px-2 py-2">
        <div className="relative grid h-8 w-8 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
          <span className="font-mono text-sm font-bold">R</span>
          <span className="pointer-events-none absolute inset-0 rounded-lg shadow-glow" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold tracking-tight">RecallOS</span>
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
                "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active
                  ? "bg-bg-soft text-ink shadow-inner"
                  : "text-ink-soft hover:bg-bg-soft/60 hover:text-ink",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-ink-mute group-hover:text-ink-soft")} />
              <span>{item.label}</span>
              {item.href === "/inbox" ? (
                <span className="ml-auto rounded-full bg-accent/15 px-1.5 text-[10px] font-semibold text-accent">
                  9
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
          <div className="text-[10px] uppercase tracking-[0.18em] text-ink-mute">
            Local Mode
          </div>
          <div className="mt-1 text-xs text-ink-soft">
            Single-user demo · SQLite
          </div>
        </div>
      </div>
    </aside>
  );
}

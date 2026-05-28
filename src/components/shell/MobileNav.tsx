"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
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
  { href: "/integrations", label: "Integrations", icon: Plug },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onOpen = () => setOpen(true);
    document.addEventListener("musemint:mobile-nav", onOpen);
    return () => document.removeEventListener("musemint:mobile-nav", onOpen);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-1 border-r border-line/70 bg-bg-panel/95 p-3 backdrop-blur-xl">
        <div className="mb-2 flex items-center justify-between px-2 py-1">
          <div className="flex items-center gap-2">
            <div className="grid h-7 w-7 place-items-center rounded-lg border border-accent/40 bg-accent/10 text-accent">
              <span className="font-mono text-xs font-bold">M</span>
            </div>
            <span className="text-sm font-semibold">Musemint</span>
          </div>
          <button onClick={() => setOpen(false)} aria-label="Close" className="btn-icon h-8 w-8">
            <X className="h-4 w-4" />
          </button>
        </div>
        {NAV.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors",
                active ? "bg-accent/10 text-ink" : "text-ink-soft hover:bg-bg-soft/60 hover:text-ink",
              )}
            >
              {active ? (
                <span className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-accent" />
              ) : null}
              <Icon className={cn("h-4 w-4", active ? "text-accent" : "text-ink-mute")} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

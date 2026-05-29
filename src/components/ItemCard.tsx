"use client";
import { Badge, ScoreBar } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { TimeAgo } from "@/components/ui/TimeAgo";
import { platformLabel } from "@/lib/utils";
import {
  Youtube,
  Linkedin,
  Instagram,
  Github,
  Link2,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Archive,
  Hammer,
  Bell,
} from "lucide-react";
import { memo, type ReactNode } from "react";

type ItemLike = {
  id: string;
  title: string;
  summary?: string | null;
  category?: string | null;
  sourcePlatform: string;
  url?: string | null;
  createdAt: Date | string;
  tags: string[];
  nextAction?: string | null;
  scores: { usefulness: number; actionability: number; portfolioValue: number; confidence: number };
};

function PlatformGlyph({ platform }: { platform: string }) {
  const map: Record<string, ReactNode> = {
    youtube: <Youtube className="h-4 w-4 text-[#ff6b6b]" />,
    linkedin: <Linkedin className="h-4 w-4 text-[#7aa8ff]" />,
    instagram: <Instagram className="h-4 w-4 text-[#ff9ad1]" />,
    github: <Github className="h-4 w-4 text-ink-soft" />,
    web: <Link2 className="h-4 w-4 text-accent" />,
    note: <FileText className="h-4 w-4 text-ink-soft" />,
    screenshot: <ImageIcon className="h-4 w-4 text-warn" />,
    prompt: <Sparkles className="h-4 w-4 text-accent" />,
  };
  return (
    <div className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-bg-soft/70">
      {map[platform] ?? <Link2 className="h-4 w-4 text-ink-soft" />}
    </div>
  );
}

function ItemCardBase({
  item,
  onAction,
  compact,
}: {
  item: ItemLike;
  onAction?: (id: string, action: "keep" | "archive" | "project" | "prompt" | "reminder") => void;
  compact?: boolean;
}) {
  return (
    <article className="panel card-hover p-4">
      <header className="flex items-start gap-3">
        <PlatformGlyph platform={item.sourcePlatform} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-ink-mute">
            <span>{platformLabel(item.sourcePlatform)}</span>
            <span>·</span>
            <TimeAgo date={item.createdAt} />
            {item.category ? (
              <>
                <span>·</span>
                <span className="text-accent">{item.category}</span>
              </>
            ) : null}
          </div>
          <h3 className="mt-1 text-sm font-semibold tracking-tight text-ink line-clamp-2">
            {item.title}
          </h3>
          {item.summary && !compact ? (
            <p className="mt-1.5 text-sm text-ink-soft line-clamp-3">{item.summary}</p>
          ) : null}
        </div>
      </header>

      {!compact ? (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <ScoreBar label="Useful" value={item.scores.usefulness} />
          <ScoreBar label="Actionable" value={item.scores.actionability} tone="success" />
          <ScoreBar label="Portfolio" value={item.scores.portfolioValue} tone="warn" />
        </div>
      ) : null}

      {item.tags?.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {item.tags.slice(0, 6).map((t) => (
            <Badge key={t} tone="muted">
              {t}
            </Badge>
          ))}
        </div>
      ) : null}

      {item.nextAction ? (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-accent/20 bg-accent/[0.06] p-2.5 text-xs text-accent">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            <span className="font-semibold uppercase tracking-wider">Next</span>{" "}
            <span className="text-ink-soft">{item.nextAction}</span>
          </span>
        </div>
      ) : null}

      {onAction ? (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Button size="sm" onClick={() => onAction(item.id, "keep")}>
            Keep
          </Button>
          <Button size="sm" onClick={() => onAction(item.id, "archive")}>
            <Archive className="h-3.5 w-3.5" /> Archive
          </Button>
          <Button size="sm" variant="primary" onClick={() => onAction(item.id, "project")}>
            <Hammer className="h-3.5 w-3.5" /> Turn into project
          </Button>
          <Button size="sm" onClick={() => onAction(item.id, "prompt")}>
            <Sparkles className="h-3.5 w-3.5" /> Save as prompt
          </Button>
          <Button size="sm" onClick={() => onAction(item.id, "reminder")}>
            <Bell className="h-3.5 w-3.5" /> Add reminder
          </Button>
        </div>
      ) : null}
    </article>
  );
}

ItemCardBase.displayName = "ItemCard";
export const ItemCard = memo(ItemCardBase);

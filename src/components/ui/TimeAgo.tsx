"use client";
import { useEffect, useState } from "react";
import { formatRelative } from "@/lib/utils";

/**
 * Renders a relative timestamp ("3h ago") that is safe to hydrate and stays
 * live. `formatRelative` reads `Date.now()`, so server HTML and the client's
 * first paint can differ by a tick — `suppressHydrationWarning` absorbs that
 * unavoidable diff. After mount it refreshes every minute so the label never
 * goes stale while a tab sits open.
 */
export function TimeAgo({
  date,
  className,
}: {
  date: Date | string | number;
  className?: string;
}) {
  const ts = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const [label, setLabel] = useState(() => formatRelative(ts));

  useEffect(() => {
    const tick = () => setLabel(formatRelative(ts));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [ts]);

  return (
    <span suppressHydrationWarning className={className}>
      {label}
    </span>
  );
}

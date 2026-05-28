"use client";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

/**
 * Gives every route a subtle fade-and-rise entrance. Keyed on the pathname so
 * the animation replays on navigation. Children are still rendered by their own
 * (often server) components — this wrapper only animates the mounted subtree.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}

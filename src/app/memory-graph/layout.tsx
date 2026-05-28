import type { Metadata } from "next";

export const metadata: Metadata = { title: "Memory Graph" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

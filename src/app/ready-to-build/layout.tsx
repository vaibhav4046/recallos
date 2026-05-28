import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ready to Build" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

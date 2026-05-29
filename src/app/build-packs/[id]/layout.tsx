import type { Metadata } from "next";

export const metadata: Metadata = { title: "Build Pack" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Job Search Vault" };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

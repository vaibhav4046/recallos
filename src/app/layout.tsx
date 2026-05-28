import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { RightPanel } from "@/components/shell/RightPanel";
import { MobileNav } from "@/components/shell/MobileNav";
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "RecallOS · Stop saving. Start building.",
  description:
    "RecallOS turns saved YouTube videos, LinkedIn posts, screenshots, and links into project briefs, prompts, and shipping work.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-bg text-ink antialiased">
        <ToastProvider>
          <div className="flex min-h-dvh">
            <Sidebar />
            <MobileNav />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar />
              <div className="flex min-h-0 flex-1">
                <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
                  {children}
                </main>
                <RightPanel />
              </div>
            </div>
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { RightPanel } from "@/components/shell/RightPanel";
import { MobileNav } from "@/components/shell/MobileNav";
import { PageTransition } from "@/components/shell/PageTransition";
import { ToastProvider } from "@/components/ui/Toast";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";

export const metadata: Metadata = {
  applicationName: "RecallOS",
  title: "RecallOS · Stop saving. Start building.",
  description:
    "RecallOS turns saved YouTube videos, LinkedIn posts, screenshots, and links into project briefs, prompts, and shipping work.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RecallOS",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07090d",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
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
          <ServiceWorkerRegister />
          <div className="flex min-h-dvh">
            <Sidebar />
            <MobileNav />
            <div className="flex min-w-0 flex-1 flex-col">
              <TopBar />
              <div className="flex min-h-0 flex-1">
                <main className="min-w-0 flex-1 px-5 py-6 md:px-8 md:py-8">
                  <PageTransition>{children}</PageTransition>
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

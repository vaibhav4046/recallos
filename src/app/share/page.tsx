"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Sparkles, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

function detectKind(url: string): string {
  const u = url.toLowerCase();
  if (/youtube\.com|youtu\.be/.test(u)) return "youtube";
  if (/instagram\.com/.test(u)) return "instagram";
  if (/linkedin\.com/.test(u)) return "linkedin";
  if (/github\.com/.test(u)) return "github";
  if (/^https?:\/\//.test(u)) return "url";
  return "note";
}

// Some apps (incl. Instagram) bundle the link inside the shared text.
function extractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s]+/);
  return m ? m[0] : null;
}

function ShareInner() {
  const sp = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<"saving" | "done" | "error">("saving");
  const [message, setMessage] = useState("Saving to Musemint…");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const sharedUrl = (sp.get("url") ?? "").trim();
    const sharedText = (sp.get("text") ?? "").trim();
    const sharedTitle = (sp.get("title") ?? "").trim();

    const url = sharedUrl || extractUrl(sharedText) || "";
    const kind = url ? detectKind(url) : "note";
    const rawContent = sharedText && sharedText !== url ? sharedText : undefined;
    const title = sharedTitle || undefined;

    if (!url && !rawContent && !title) {
      setState("error");
      setMessage("Nothing was shared. Open Musemint to capture manually.");
      return;
    }

    fetch("/api/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind,
        intent: "auto",
        url: url || undefined,
        title,
        rawContent,
        process: true,
      }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "failed");
        }
        setState("done");
        setMessage("Saved! Musemint is classifying and scoring it now.");
        setTimeout(() => router.replace("/inbox"), 1000);
      })
      .catch(() => {
        setState("error");
        setMessage("Couldn't save automatically — open it in the capture screen.");
      });
  }, [sp, router]);

  const sharedUrl = sp.get("url") ?? "";

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center text-center">
      <div className="panel w-full p-8">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-accent/30 bg-accent/10 text-accent">
          {state === "saving" ? (
            <Loader2 className="h-6 w-6 animate-spin" />
          ) : state === "done" ? (
            <CheckCircle2 className="h-6 w-6 text-success" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-warn" />
          )}
        </div>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-ink">
          {state === "saving"
            ? "Capturing your share"
            : state === "done"
              ? "Captured"
              : "Couldn't auto-save"}
        </h1>
        <p className="mt-2 text-sm text-ink-mute">{message}</p>
        {state === "error" ? (
          <button
            onClick={() =>
              router.replace(
                `/capture${sharedUrl ? `?url=${encodeURIComponent(sharedUrl)}` : ""}`,
              )
            }
            className="btn-primary mt-5 w-full justify-center"
          >
            <Sparkles className="h-4 w-4" /> Open capture
          </button>
        ) : null}
      </div>
      <p className="mt-4 text-xs text-ink-faint">
        Tip: add Musemint to your home screen, then use Share → Musemint from any app.
      </p>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      }
    >
      <ShareInner />
    </Suspense>
  );
}

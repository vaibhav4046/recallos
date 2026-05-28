"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

const ToastContext = createContext<{
  toast: (t: Omit<Toast, "id">) => void;
} | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const remove = useCallback((id: number) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = ++counter;
    setItems((prev) => [...prev, { ...t, id }]);
    setTimeout(() => remove(id), 4200);
  }, [remove]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-2">
        {items.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto panel flex items-start gap-3 border bg-bg-raised/95 p-3 shadow-glow animate-fade-in",
              t.kind === "success" && "border-success/40",
              t.kind === "error" && "border-danger/40",
              t.kind === "info" && "border-accent/40",
            )}
          >
            <div className="mt-0.5 shrink-0">
              {t.kind === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : t.kind === "error" ? (
                <AlertCircle className="h-4 w-4 text-danger" />
              ) : (
                <Info className="h-4 w-4 text-accent" />
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink">{t.title}</div>
              {t.body ? (
                <div className="mt-0.5 text-xs text-ink-mute">{t.body}</div>
              ) : null}
            </div>
            <button
              onClick={() => remove(t.id)}
              className="text-ink-mute hover:text-ink"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be inside <ToastProvider>");
  return ctx.toast;
}

export function useDelayedReady(ms = 200) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return ready;
}

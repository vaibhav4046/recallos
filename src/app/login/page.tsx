"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Lock, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

function safeTarget(from: string | null): string {
  // Only allow local absolute paths — blocks open-redirect via // or http(s):.
  if (from && from.startsWith("/") && !from.startsWith("//")) return from;
  return "/dashboard";
}

function LoginInner() {
  const sp = useSearchParams();
  const target = safeTarget(sp.get("from"));
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        // Hard navigation so middleware re-evaluates with the fresh cookie.
        window.location.assign(target);
        return;
      }
      if (res.status === 401) setError("Incorrect password.");
      else if (res.status === 429) setError("Too many attempts — wait a minute.");
      else setError("Something went wrong. Please try again.");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center overflow-auto bg-bg px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2 text-accent">
          <Sparkles className="h-5 w-5" />
          <span className="text-lg font-semibold tracking-tight text-ink">Musemint</span>
        </div>
        <div className="panel p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Lock className="h-4 w-4 text-accent" /> Locked workspace
          </div>
          <p className="mt-1 text-sm text-ink-mute">
            This Musemint instance is password-protected. Enter the access password to continue.
          </p>
          <form onSubmit={onSubmit} className="mt-4 space-y-3">
            <div>
              <label className="field-label" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input mt-1"
                aria-invalid={!!error}
              />
            </div>
            {error ? (
              <p className="text-sm text-danger" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loading || !password}
              className="btn-primary w-full justify-center"
            >
              {loading ? "Checking…" : (
                <>
                  Unlock <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-ink-faint">
          Set <code className="text-ink-mute">APP_PASSWORD</code> to enable this gate.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

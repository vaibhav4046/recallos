"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-danger/40 bg-danger/10 text-danger">
        !
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Something snapped.</h1>
      <p className="text-sm text-ink-mute">
        Musemint hit an unexpected error. Your memory is safe — try again or reload.
      </p>
      <pre className="max-w-md overflow-auto rounded-lg border border-line-soft bg-bg-soft/40 p-3 text-xs text-ink-mute">
        {error.message}
      </pre>
      <div className="flex items-center gap-2">
        <Button variant="primary" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </div>
  );
}

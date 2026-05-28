import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-bg-raised text-2xl">
        404
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">That memory isn't here.</h1>
      <p className="text-sm text-ink-mute">
        The page you tried to open doesn't exist — likely renamed or never created.
      </p>
      <Link href="/dashboard" className="btn-primary">
        Back to dashboard
      </Link>
    </div>
  );
}

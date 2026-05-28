export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="panel h-24 shimmer" />
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="panel h-24 shimmer" />
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="panel h-64 shimmer" />
        ))}
      </div>
    </div>
  );
}

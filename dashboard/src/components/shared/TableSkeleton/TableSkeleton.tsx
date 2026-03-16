export function TableSkeleton() {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="animate-pulse space-y-4">
        <div className="h-5 w-40 rounded bg-muted" />
        <div className="grid grid-cols-4 gap-3">
          <div className="h-4 rounded bg-muted" />
          <div className="h-4 rounded bg-muted" />
          <div className="h-4 rounded bg-muted" />
          <div className="h-4 rounded bg-muted" />
        </div>

        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-3">
            <div className="h-4 rounded bg-muted/70" />
            <div className="h-4 rounded bg-muted/70" />
            <div className="h-4 rounded bg-muted/70" />
            <div className="h-4 rounded bg-muted/70" />
          </div>
        ))}
      </div>
    </div>
  );
}

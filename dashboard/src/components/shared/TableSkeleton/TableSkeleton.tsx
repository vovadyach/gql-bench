export function TableSkeleton({
  rows = 10,
  groups = 2,
  rowHeight = 41,
}: {
  rows?: number;
  groups?: number;
  rowHeight?: number;
}) {
  return (
    <div className="mb-8" role="status" aria-label="Loading benchmark table">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="h-5 w-40 rounded bg-muted mb-1" />
        <div className="h-4 w-64 max-w-full rounded bg-muted mb-4" />
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="h-[41px] border-b bg-muted/30" />
          <div style={{ height: groups * 33 }} />
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="border-b last:border-0 px-3 flex items-center gap-3"
              style={{ height: rowHeight }}
            >
              <div className="h-3 w-1/3 rounded bg-muted" />
              <div className="h-3 flex-1 rounded bg-muted/70" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

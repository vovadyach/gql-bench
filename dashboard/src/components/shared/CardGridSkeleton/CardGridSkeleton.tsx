export function CardGridSkeleton({ count, tall = false }: { count: number; tall?: boolean }) {
  return (
    <div className="mb-8" role="status" aria-label="Loading benchmark cards">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="h-5 w-40 rounded bg-muted mb-1" />
        <div className="h-4 w-64 max-w-full rounded bg-muted mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
          {Array.from({ length: count }, (_, i) => (
            <div
              key={i}
              className={`rounded-xl border p-4 bg-card space-y-3 ${tall ? 'min-h-[220px]' : 'min-h-[180px]'}`}
            >
              <div className="h-4 w-3/4 rounded bg-muted" />
              <div className="h-7 w-1/2 rounded bg-muted" />
              <div className="h-4 w-2/3 rounded bg-muted" />
              <div className="h-4 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

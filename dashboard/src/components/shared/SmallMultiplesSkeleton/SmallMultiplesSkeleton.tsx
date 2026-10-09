// Mirrors ScenarioSmallMultiples (title, legend, panel grid) so lazy loading doesn't shift the page
export function SmallMultiplesSkeleton({ panels }: { panels: number }) {
  return (
    <div className="mb-8" role="status" aria-label="Loading chart">
      <div aria-hidden="true" className="motion-safe:animate-pulse">
        <div className="h-5 w-48 rounded bg-muted mb-1" />
        <div className="h-4 w-80 max-w-full rounded bg-muted mb-4" />
        <div className="h-14 sm:h-4 w-96 max-w-full rounded bg-muted mb-3" />
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
          {Array.from({ length: panels }, (_, i) => (
            <div key={i} className="h-[233px] rounded-xl border bg-card" />
          ))}
        </div>
      </div>
    </div>
  );
}

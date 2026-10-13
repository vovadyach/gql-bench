export function SectionSkeleton({ height = 'min-h-[310px]' }: { height?: string }) {
  return (
    <div className={`mb-8 flex flex-col ${height}`} role="status" aria-label="Loading section">
      <div aria-hidden="true" className="motion-safe:animate-pulse flex flex-1 flex-col">
        <div className="h-5 w-40 rounded bg-muted mb-1" />
        <div className="h-4 w-64 max-w-full rounded bg-muted mb-4" />
        <div className="rounded-xl border bg-card p-4 flex-1">
          <div className="h-full min-h-[120px] rounded-lg bg-muted/70" />
        </div>
      </div>
    </div>
  );
}

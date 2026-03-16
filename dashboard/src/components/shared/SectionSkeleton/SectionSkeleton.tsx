export function SectionSkeleton({ height = 'h-40' }: { height?: string }) {
  return (
    <div className={`rounded-xl border bg-card p-4 ${height}`}>
      <div className="animate-pulse space-y-3">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-3 w-24 rounded bg-muted" />
        <div className="h-full min-h-[120px] rounded-lg bg-muted/70" />
      </div>
    </div>
  );
}

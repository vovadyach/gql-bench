import { BenchmarkMeta } from '@/lib/types';

export function Footer({ meta }: { meta: BenchmarkMeta }) {
  return (
    <footer className="mt-8 pt-4 border-t flex justify-between flex-wrap gap-2 text-xs text-muted-foreground">
      <span>
        <span className="font-semibold" style={{ color: 'var(--server-mercurius)' }}>
          GraphQL Bench
        </span>{' '}
        · k6 by Grafana Labs · {meta.cpu_model}
      </span>
      <span>
        Same schema · Same queries · Sequential execution ·{' '}
        <span className="font-semibold" style={{ color: 'var(--server-fastify)' }}>
          Fair fight
        </span>
      </span>
    </footer>
  );
}

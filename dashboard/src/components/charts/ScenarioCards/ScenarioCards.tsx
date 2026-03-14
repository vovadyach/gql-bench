import type { ScenarioCardsProps } from '@/components/charts/ScenarioCards/ScenarioCards.types';
import { calcPercentage, getSlowest, getWinner } from '@/lib/utils';
import { SERVERS } from '@/lib/constants';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { Crown } from 'lucide-react';
export function ScenarioCards({ scenario, visible }: ScenarioCardsProps) {
  const winner = getWinner(scenario, visible);
  const slowest = getSlowest(scenario, visible);
  const slowestRate = scenario.servers[slowest]?.requests?.rate || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-7">
      {Object.entries(SERVERS)
        .filter(([key]) => visible.includes(key))
        .map(([key, server]) => {
          const data = scenario.servers[key];
          if (!data) return null;

          const isWinner = key === winner;
          const pct = calcPercentage(data.requests.rate, slowestRate);

          return (
            <div
              key={key}
              className="rounded-xl border p-5 bg-card relative overflow-hidden"
              style={{
                borderColor: isWinner ? `var(--server-${key})` : 'var(--border)',
                backgroundColor: isWinner
                  ? `color-mix(in srgb, var(--server-${key}) 5%, var(--card))`
                  : undefined,
              }}
            >
              {isWinner && (
                <div className="absolute top-3 right-3 rounded-full border border-border/60 bg-background/90 p-1.5 shadow-md backdrop-blur-sm">
                  <Crown
                    className="h-4 w-4 text-foreground/80 dark:text-amber-400"
                    strokeWidth={2.2}
                  />
                </div>
              )}

              <span className="text-xs font-bold" style={{ color: `var(--server-${key})` }}>
                {server.label}
              </span>

              <div
                className="text-2xl sm:text-3xl font-extrabold font-mono tabular-nums leading-none mt-2"
                style={{ color: `var(--server-${key})` }}
              >
                <AnimatedNumber value={data.requests.rate} />
                <span className="text-xs text-muted-foreground ml-2">req/s</span>
              </div>

              {key !== slowest && visible.length > 1 && (
                <p className="text-xs font-bold mt-2" style={{ color: `var(--server-${key})` }}>
                  +{pct}% vs slowest
                </p>
              )}
              {key === slowest && visible.length > 1 && (
                <p className="text-xs text-muted-foreground mt-2">baseline</p>
              )}

              <div className="grid grid-cols-2 gap-1 mt-4 text-xs text-muted-foreground font-mono tabular-nums">
                <span>avg {data.latency_ms.avg}ms</span>
                <span>med {data.latency_ms.med}ms</span>
                <span>p95 {data.latency_ms.p95}ms</span>
                <span>p99 {data.latency_ms.p99}ms</span>
              </div>
            </div>
          );
        })}
    </div>
  );
}

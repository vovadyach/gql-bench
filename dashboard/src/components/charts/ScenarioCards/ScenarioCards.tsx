import type { ScenarioCardsProps } from '@/components/charts/ScenarioCards/ScenarioCards.types';
import { calcPercentage, cn, getSlowest, getWinner } from '@/lib/utils';
import { SERVERS, TIER_LABELS } from '@/lib/constants';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { Crown } from 'lucide-react';
import { NestjsDelta } from '@/components/shared/NestjsDelta/NestjsDelta';

export function ScenarioCards({ scenario, visible }: ScenarioCardsProps) {
  const winner = getWinner(scenario, visible);
  const slowest = getSlowest(scenario, visible);
  const slowestRate = scenario.servers[slowest]?.requests?.rate || 0;

  return (
    <div className="mb-7">
      <h2 className="text-sm font-bold mb-2">Scenario Deep Dive</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {Object.entries(SERVERS).map(([key, server]) => {
          const data = scenario.servers[key];
          const isOn = visible.includes(key);

          if (!data) return null;

          const isWinner = key === winner;
          const pct = calcPercentage(data.requests.rate, slowestRate);

          return (
            <div
              key={key}
              className={cn(
                'min-w-0 rounded-xl border p-4 bg-card relative transition-transform duration-300 ease-in-out',
                !isOn && 'opacity-40 grayscale scale-95',
              )}
              style={{
                borderColor: isOn ? `var(--server-${key})` : 'var(--border)',
                borderStyle: server.tier === 'nestjs' ? 'solid' : 'dashed',
                backgroundColor: isOn
                  ? `color-mix(in srgb, var(--server-${key}) 5%, var(--card))`
                  : undefined,
              }}
            >
              <div
                className={cn(
                  'absolute top-3 right-3 rounded-full border border-border/60 bg-background/90 p-1.5 shadow-md backdrop-blur-sm',
                  !(isWinner && isOn) && 'invisible',
                )}
              >
                <Crown
                  className="h-4 w-4 text-foreground/80 dark:text-amber-400"
                  strokeWidth={2.2}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pr-9">
                <span className="text-xs font-bold" style={{ color: `var(--server-${key})` }}>
                  {server.label}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 border border-border rounded">
                  {TIER_LABELS[server.tier]}
                </span>
              </div>

              <div
                className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums leading-none mt-2"
                style={{ color: `var(--server-${key})` }}
              >
                <AnimatedNumber value={data.requests.rate} shouldAnimate={isOn} />
                <span className="text-xs text-muted-foreground ml-2">req/s</span>
              </div>

              <div className="mt-2 h-4">
                <p
                  className={cn(
                    'text-xs',
                    (!isOn || visible.length <= 1) && 'opacity-0',
                    isOn && key === slowest && visible.length > 1 && 'text-muted-foreground',
                    isOn && key !== slowest && visible.length > 1 && 'font-bold',
                  )}
                  style={
                    isOn && key !== slowest && visible.length > 1
                      ? { color: `var(--server-${key})` }
                      : undefined
                  }
                >
                  {!isOn || visible.length <= 1
                    ? 'placeholder'
                    : key === slowest
                      ? 'baseline'
                      : `+${pct}% vs slowest`}
                </p>
              </div>
              <NestjsDelta results={scenario.servers} serverKey={key} className="mt-1" />

              <div className="grid grid-cols-2 gap-1 mt-4 text-[11px] text-muted-foreground font-mono tabular-nums">
                <span>avg {data.latency_ms.avg}ms</span>
                <span>med {data.latency_ms.med}ms</span>
                <span>p95 {data.latency_ms.p95}ms</span>
                <span>p99 {data.latency_ms.p99}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

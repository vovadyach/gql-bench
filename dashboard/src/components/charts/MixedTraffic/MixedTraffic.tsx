import { MixedTrafficProps } from '@/components/charts/MixedTraffic/MixedTraffic.types';
import { SERVERS } from '@/lib/constants';
import { calcPercentage, cn } from '@/lib/utils';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { Crown } from 'lucide-react';

export function MixedTraffic({ data, visible }: MixedTrafficProps) {
  if (!data) return null;

  const winner = visible.reduce(
    (best, k) => ((data[k]?.requests?.rate || 0) > (data[best]?.requests?.rate || 0) ? k : best),
    visible[0],
  );
  const slowest = visible.reduce(
    (worst, k) => ((data[k]?.requests?.rate || 0) < (data[worst]?.requests?.rate || 0) ? k : worst),
    visible[0],
  );
  const slowestRate = data[slowest]?.requests?.rate || 0;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Mixed Traffic</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Production-like query mix — 60% light, 25% medium, 15% heavy
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {Object.entries(SERVERS).map(([key, server]) => {
          const isOn = visible.includes(key);
          const d = data[key];
          if (!d) return null;
          const isWinner = key === winner;
          const pct = calcPercentage(d.requests.rate, slowestRate);

          return (
            <div
              key={key}
              className={`rounded-xl border p-4 bg-card relative ${!isOn ? 'opacity-40' : ''}`}
              style={{
                borderColor: isOn ? `var(--server-${key})` : 'var(--border)',
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

              <span className="text-xs font-bold" style={{ color: `var(--server-${key})` }}>
                {server.label}
              </span>
              <div
                className="text-xl font-extrabold font-mono tabular-nums mt-1"
                style={{ color: `var(--server-${key})` }}
              >
                <AnimatedNumber value={d.requests.rate} />
                <span className="text-xs text-muted-foreground ml-1">req/s</span>
              </div>
              <p
                className={cn(
                  'text-xs mt-1 min-h-[16px]',
                  !(isOn && visible.length > 1) && 'invisible',
                  key === slowest ? 'text-muted-foreground font-normal' : 'font-bold',
                )}
                style={
                  isOn && visible.length > 1 && key !== slowest
                    ? { color: `var(--server-${key})` }
                    : undefined
                }
              >
                {key === slowest ? 'baseline' : `+${pct}% vs slowest`}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground font-mono tabular-nums">
                <span>avg {d.latency_ms.avg}ms</span>
                <span>p99 {d.latency_ms.p99}ms</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

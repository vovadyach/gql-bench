import { DegradationProps } from '@/components/charts/Degradation/Degradation.types';
import { SERVERS, TIER_LABELS } from '@/lib/constants';
import { calcPercentage, cn, formatNumber } from '@/lib/utils';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { Crown } from 'lucide-react';
import { NestjsDelta } from '@/components/shared/NestjsDelta/NestjsDelta';

export default function Degradation({ data, visible }: DegradationProps) {
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
      <h2 className="text-sm font-bold mb-1">Degradation Curve</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Ramp to 500 VUs — finding the breaking point
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
        {Object.entries(SERVERS).map(([key, server]) => {
          const isOn = visible.includes(key);
          const d = data[key];
          if (!d) return null;
          const isWinner = key === winner;
          const pct = calcPercentage(d.requests.rate, slowestRate);

          return (
            <div
              key={key}
              className={cn(
                'min-w-0 rounded-xl border p-4 bg-card relative',
                !isOn && 'opacity-40 grayscale scale-95',
              )}
              style={{
                borderColor: `var(--server-${key})`,
                borderStyle: server.tier === 'nestjs' ? 'solid' : 'dashed',
                backgroundColor: `color-mix(in srgb, var(--server-${key}) 5%, var(--card))`,
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
                className="text-xl font-extrabold font-mono tabular-nums mt-1"
                style={{ color: `var(--server-${key})` }}
              >
                <AnimatedNumber value={d.requests.rate} />
                <span className="text-xs text-muted-foreground ml-1">req/s</span>
              </div>
              <p
                className={cn(
                  'text-xs mt-1 min-h-[16px]',
                  key === slowest ? 'text-muted-foreground' : 'font-bold',
                )}
                style={
                  isOn && visible.length > 1 && key !== slowest
                    ? { color: `var(--server-${key})` }
                    : undefined
                }
              >
                {isOn && visible.length > 1
                  ? key === slowest
                    ? 'baseline'
                    : `+${pct}% vs slowest`
                  : null}
              </p>
              <NestjsDelta results={data} serverKey={key} className="mt-1" />
              <div className="grid grid-cols-2 gap-1 mt-3 text-[11px] text-muted-foreground font-mono tabular-nums">
                <span>avg {d.latency_ms.avg}ms</span>
                <span>med {d.latency_ms.med}ms</span>
                <span>p99 {d.latency_ms.p99}ms</span>
                <span>max {d.latency_ms.max}ms</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                <span>Total: {formatNumber(d.requests.total)} requests</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

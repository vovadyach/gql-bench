import { HeroCardsProps } from '@/components/charts/HeroCards/HeroCards.types';
import { SERVERS } from '@/lib/constants';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { cn } from '@/lib/utils';

export function HeroCards({ scenario, visible }: HeroCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
      {Object.entries(SERVERS).map(([key, server]) => {
        const isOn = visible.includes(key);
        const data = scenario.servers[key];
        if (!data) return null;

        return (
          <div
            key={key}
            className={cn(
              'w-full min-w-0 rounded-xl border p-5 bg-card',
              !isOn && 'opacity-50 grayscale',
            )}
            style={{
              borderColor: `var(--server-${key})`,
              backgroundColor: `color-mix(in srgb, var(--server-${key}) 5%, var(--card))`,
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: `var(--server-${key})`,
                  boxShadow: `0 0 6px var(--server-${key})`,
                }}
              />
              <span
                className="text-xs font-bold tracking-wide"
                style={{ color: `var(--server-${key})` }}
              >
                {server.short}
              </span>
            </div>

            <div
              className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums leading-none"
              style={{ color: `var(--server-${key})` }}
            >
              <AnimatedNumber value={data.requests.rate} />
            </div>

            <p className="text-xs text-muted-foreground mt-2">req/s on health check</p>

            <div className="flex gap-4 mt-3 text-xs text-muted-foreground font-mono tabular-nums">
              <span>avg {data.latency_ms.avg}ms</span>
              <span>p99 {data.latency_ms.p99}ms</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

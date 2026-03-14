import { HeroCardsProps } from '@/components/charts/HeroCards/HeroCards.types';
import { SERVERS } from '@/lib/constants';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { cn } from '@/lib/utils';

export function HeroCards({ scenario, visible }: HeroCardsProps) {
  // const vis = Object.entries(SERVERS).filter(([key]) => visible.includes(key));

  return (
    <div className="relative mb-7 sm:mb-7">
      {/* Left shadow */}
      <div className="absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none sm:hidden" />
      {/* Right shadow */}
      <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none sm:hidden" />

      <div
        className={cn(
          'flex gap-3 mb-7 overflow-x-auto snap-x snap-mandatory pb-2 scrollbar-hide',
          'sm:grid sm:overflow-visible sm:pb-0 sm:grid-cols-3',
        )}
      >
        {Object.entries(SERVERS).map(([key, server]) => {
          const isOn = visible.includes(key);
          const data = scenario.servers[key];
          if (!data) return null;

          return (
            <div
              key={key}
              className={cn(
                'rounded-xl border p-5 bg-card',
                'shrink-0 snap-start', // mobile: snap point
                'w-[280px] sm:w-auto', // mobile: fixed width, desktop: fill grid
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
    </div>
  );
}

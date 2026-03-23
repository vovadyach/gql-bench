import { HeroCardsProps } from '@/components/charts/HeroCards/HeroCards.types';
import { SERVERS } from '@/lib/constants';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { cn } from '@/lib/utils';

export function HeroCards({ scenario, visible, title }: HeroCardsProps) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(SERVERS).map(([key, server]) => {
          const isOn = visible.includes(key);
          const data = scenario.servers[key];
          if (!data) return null;

          return (
            <div
              key={key}
              className={cn(
                'w-full min-w-0 rounded-xl border p-4 bg-card transition-transform duration-300 ease-in-out',
                !isOn && 'opacity-50 grayscale scale-95',
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
                className="text-base sm:text-lg font-extrabold font-mono tabular-nums leading-none"
                style={{ color: `var(--server-${key})` }}
              >
                <div className="text-xl sm:text-2xl font-extrabold font-mono tabular-nums leading-none">
                  <AnimatedNumber value={data.requests.rate} />
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-2">req/s on health check</p>

              <div className="flex gap-4 mt-1 text-[11px] text-muted-foreground font-mono tabular-nums">
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

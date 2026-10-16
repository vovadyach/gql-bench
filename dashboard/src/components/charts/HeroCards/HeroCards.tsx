import { HeroCardsProps } from '@/components/charts/HeroCards/HeroCards.types';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { NestjsDelta } from '@/components/shared/NestjsDelta/NestjsDelta';
import { VsFastestNode } from '@/components/shared/VsFastestNode/VsFastestNode';
import { cn, serverLabel } from '@/lib/utils';

// Column counts that never leave a card alone on the last row; 1–2 cards keep the
// card width of the 4-card row above
const GRID_COLUMNS: Record<number, string> = {
  1: 'grid-cols-2 xl:grid-cols-4',
  2: 'grid-cols-2 xl:grid-cols-4',
  4: 'grid-cols-2 xl:grid-cols-4',
  6: 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
};

export function HeroCards({ scenario, visible, title, servers }: HeroCardsProps) {
  const cards = servers.filter(([key]) => scenario.servers[key]);
  if (!cards.length) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {title}
        </span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div
        className={cn(
          'grid gap-3',
          GRID_COLUMNS[cards.length] ?? 'grid-cols-[repeat(auto-fit,minmax(min(100%,220px),1fr))]',
        )}
      >
        {cards.map(([key, server]) => {
          const isOn = visible.includes(key);
          const data = scenario.servers[key];

          return (
            <div
              key={key}
              className={cn(
                'w-full min-w-0 rounded-xl border p-3 sm:p-4 bg-card transition-transform duration-300 ease-in-out',
                !isOn && 'opacity-50 grayscale scale-95',
              )}
              style={{
                borderColor: `var(--server-${key})`,
                backgroundColor: `color-mix(in srgb, var(--server-${key}) 5%, var(--card))`,
                borderStyle: server.tier === 'nestjs' ? 'solid' : 'dashed',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    backgroundColor: `var(--server-${key})`,
                    boxShadow: `0 0 6px var(--server-${key})`,
                  }}
                />
                <span
                  className="text-xs font-bold tracking-wide"
                  style={{ color: `var(--server-${key})` }}
                >
                  {serverLabel(key)}
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

              <NestjsDelta results={scenario.servers} serverKey={key} className="mt-1" />
              <VsFastestNode results={scenario.servers} serverKey={key} className="mt-1" />

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-[11px] text-muted-foreground font-mono tabular-nums">
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

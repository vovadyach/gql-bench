import { SERVERS, TIER_FILL_OPACITY, TIER_LABELS } from '@/lib/constants';
import { chartOrder, serverColor, serverLabel } from '@/lib/utils';
import type { ChartLegendProps } from './ChartLegend.types';

// Color = stack (a NestJS server and its direct twin share it), fill = tier;
// other languages have their own color and no NestJS/direct fill
export function ChartLegend({ visible }: ChartLegendProps) {
  const ordered = chartOrder(visible);
  const stacks = [...new Set(ordered.map((k) => SERVERS[k].nestjsTwin ?? k))];
  const tiers = [...new Set(ordered.map((k) => SERVERS[k].tier))].filter((t) => t !== 'other');

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-3 text-[11px] text-muted-foreground">
      {stacks.map((k) => (
        <span key={k} className="inline-flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: serverColor(k) }} />
          {serverLabel(k)}
        </span>
      ))}
      {tiers.length > 1 && (
        <span className="inline-flex items-center gap-3 sm:ml-auto">
          {tiers.map((tier) => (
            <span key={tier} className="inline-flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-sm bg-foreground"
                style={{ opacity: TIER_FILL_OPACITY[tier] }}
              />
              {tier === 'nestjs' ? TIER_LABELS[tier] : `${TIER_LABELS[tier]} (without NestJS)`}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}

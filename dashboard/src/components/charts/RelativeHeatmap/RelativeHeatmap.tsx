'use client';

import { SERVERS, TIER_FILL_OPACITY, TIER_LABELS } from '@/lib/constants';
import { chartOrder, cn, serverColor } from '@/lib/utils';
import type { RelativeHeatmapProps } from './RelativeHeatmap.types';

// Throughput as % of the fastest visible server in each scenario. One hue, stronger = faster;
// every cell prints its number, so the color never gates the value.
export default function RelativeHeatmap({ scenarios, visible }: RelativeHeatmapProps) {
  const keys = chartOrder(visible);
  const scores = keys.map((k) =>
    scenarios.map((s) => {
      const rate = s.servers[k]?.requests?.rate;
      const fastest = Math.max(...keys.map((key) => s.servers[key]?.requests?.rate || 0));
      return rate && fastest ? Math.round((rate / fastest) * 100) : null;
    }),
  );
  // Stretch the color scale over the scores actually shown, so 40 vs 60 is visible
  const lowest = Math.min(...scores.flat().filter((v): v is number => v !== null));
  const strength = (score: number) => (lowest < 100 ? (score - lowest) / (100 - lowest) : 1);

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Relative Throughput</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Fastest server in each scenario = 100, higher is better
      </p>
      <div className="border rounded-xl bg-card overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead>
            <tr className="border-b">
              <th className="px-3 py-3 text-left text-[10px] font-semibold tracking-wide text-muted-foreground">
                FRAMEWORK
              </th>
              {scenarios.map((s) => (
                <th
                  key={s.id}
                  className="px-3 py-3 text-right text-[10px] font-semibold text-muted-foreground"
                >
                  {s.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((k, row) => (
              <tr key={k} className="border-b last:border-0">
                <td className="px-3 py-2 whitespace-nowrap">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-sm shrink-0"
                      style={{
                        backgroundColor: serverColor(k),
                        opacity: TIER_FILL_OPACITY[SERVERS[k].tier],
                      }}
                    />
                    <span className="font-semibold">{SERVERS[k].label}</span>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground px-1.5 py-0.5 border border-border rounded">
                      {TIER_LABELS[SERVERS[k].tier]}
                    </span>
                  </span>
                </td>
                {scenarios.map((s, col) => {
                  const score = scores[row][col];
                  return (
                    <td
                      key={s.id}
                      className={cn(
                        'px-3 py-2 text-right font-mono tabular-nums',
                        score === 100 && 'font-bold',
                      )}
                      style={
                        score === null
                          ? undefined
                          : {
                              backgroundColor: `color-mix(in srgb, var(--heat) calc(6% + (var(--heat-max) - 6%) * ${strength(score)}), transparent)`,
                            }
                      }
                    >
                      {score ?? '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

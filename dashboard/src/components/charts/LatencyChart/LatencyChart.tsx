'use client';

import { LatencyChartProps } from '@/components/charts/LatencyChart/LatencyChart.types';
import { useMemo } from 'react';
import { SERVERS, TIER_FILL_OPACITY } from '@/lib/constants';
import { chartOrder, serverColor, serverName } from '@/lib/utils';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartLegend } from '@/components/charts/ChartLegend/ChartLegend';

export function LatencyChart({ scenario, visible }: LatencyChartProps) {
  const keys = useMemo(() => chartOrder(visible), [visible]);
  const data = useMemo(
    () =>
      ['med', 'p90', 'p95', 'p99'].map((p) => {
        const row: Record<string, string | number> = {
          pct: p === 'med' ? 'P50' : p.toUpperCase(),
        };
        keys.forEach((k) => {
          row[k] =
            scenario.servers[k]?.latency_ms?.[
              p as keyof (typeof scenario.servers)[typeof k]['latency_ms']
            ] || 0;
        });
        return row;
      }),
    [scenario, keys],
  );

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Latency Percentiles — {scenario.name}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Response time distribution — lower is better
      </p>
      <ChartLegend visible={visible} />

      <div className="border rounded-xl p-4 bg-card">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart
            margin={{ left: -20, right: 15, top: 10, bottom: 5 }}
            data={data}
            barGap={2}
            barCategoryGap="18%"
          >
            <CartesianGrid vertical={false} stroke="var(--border)" />
            <XAxis
              dataKey="pct"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
              axisLine={{ stroke: 'var(--border)' }}
              unit="ms"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card)',
                border: '1px solid var(--border)',
                margin: '0',
                borderRadius: 10,
                fontSize: 12,
              }}
              itemStyle={{
                lineHeight: '14px',
                fontSize: 11,
                color: 'var(--foreground)',
              }}
            />
            {keys.map((k) => (
              <Bar
                key={k}
                dataKey={k}
                name={serverName(k)}
                fill={serverColor(k)}
                fillOpacity={TIER_FILL_OPACITY[SERVERS[k].tier]}
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

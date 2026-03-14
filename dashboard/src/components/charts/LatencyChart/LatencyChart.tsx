'use client';

import { LatencyChartProps } from '@/components/charts/LatencyChart/LatencyChart.types';
import { useMemo } from 'react';
import { SERVERS } from '@/lib/constants';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export function LatencyChart({ scenario, visible }: LatencyChartProps) {
  const data = useMemo(
    () =>
      ['med', 'p90', 'p95', 'p99'].map((p) => {
        const row: Record<string, string | number> = {
          pct: p === 'med' ? 'P50' : p.toUpperCase(),
        };
        visible.forEach((k) => {
          row[SERVERS[k].label] =
            scenario.servers[k]?.latency_ms?.[
              p as keyof (typeof scenario.servers)[typeof k]['latency_ms']
            ] || 0;
        });
        return row;
      }),
    [scenario, visible],
  );

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Latency Percentiles — {scenario.name}</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Response time distribution — lower is better
      </p>

      <div className="border rounded-xl p-4 bg-card">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} barGap={2} barCategoryGap="18%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
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
                borderRadius: 10,
                fontSize: 11,
              }}
            />
            {visible.map((k) => (
              <Bar
                key={k}
                dataKey={SERVERS[k].label}
                fill={SERVERS[k].color}
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

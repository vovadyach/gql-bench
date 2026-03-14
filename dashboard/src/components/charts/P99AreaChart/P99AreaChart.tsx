'use client';

import { P99AreaChartProps } from '@/components/charts/P99AreaChart/P99AreaChart.types';
import { useMemo } from 'react';
import { SERVERS } from '@/lib/constants';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export function P99AreaChart({ scenarios, visible }: P99AreaChartProps) {
  const data = useMemo(
    () =>
      scenarios.map((s) => {
        const row: Record<string, string | number> = { name: s.name };
        visible.forEach((k) => {
          row[SERVERS[k].label] = s.servers[k]?.latency_ms?.p99 || 0;
        });
        return row;
      }),
    [scenarios, visible],
  );

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">p99 Latency Across Scenarios</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Worst 1% of requests — what your unhappiest users experience
      </p>

      <div className="border rounded-xl p-4 bg-card">
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
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
              }}
            />
            {visible.map((k) => (
              <Area
                key={k}
                type="monotone"
                dataKey={SERVERS[k].label}
                stroke={SERVERS[k].color}
                fill={SERVERS[k].color}
                fillOpacity={0.08}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

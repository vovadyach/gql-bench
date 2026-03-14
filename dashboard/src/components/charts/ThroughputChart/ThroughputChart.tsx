'use client';

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SERVERS } from '@/lib/constants';
import { formatReqPerSec } from '@/lib/utils';
import type { ThroughputChartProps } from './ThroughputChart.types';

export function ThroughputChart({ scenarios, visible }: ThroughputChartProps) {
  const data = useMemo(
    () =>
      scenarios.map((s) => {
        const row: Record<string, string | number> = { name: s.name };
        visible.forEach((k) => {
          row[SERVERS[k].label] = s.servers[k]?.requests?.rate || 0;
        });
        return row;
      }),
    [scenarios, visible],
  );

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Throughput by Scenario</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Requests per second — lightest to heaviest
      </p>
      <div className="border rounded-xl p-4 bg-card">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={data} barGap={2} barCategoryGap="14%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border)' }}
            />
            <YAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
              axisLine={{ stroke: 'var(--border)' }}
              tickFormatter={formatReqPerSec}
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

'use client';

import { useMemo } from 'react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SERVERS } from '@/lib/constants';
import { PerformanceRadarProps } from '@/components/charts/PerformanceRadar/PerformanceRadarProps.types';

export function PerformanceRadar({ scenarios, visible }: PerformanceRadarProps) {
  const data = useMemo(
    () =>
      scenarios.map((s) => {
        const maxRate = Math.max(...visible.map((k) => s.servers[k]?.requests?.rate || 0));
        const row: Record<string, string | number> = { name: s.id };
        visible.forEach((k) => {
          row[SERVERS[k].label] =
            maxRate > 0 ? +(((s.servers[k]?.requests?.rate || 0) / maxRate) * 100).toFixed(0) : 0;
        });
        return row;
      }),
    [scenarios, visible],
  );

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Performance Radar</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Normalized to fastest per scenario — 100 = best
      </p>
      <div className="border rounded-xl p-4 bg-card flex justify-center">
        <ResponsiveContainer width="100%" height={320} maxHeight={320}>
          <RadarChart outerRadius={110} data={data}>
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="name"
              tick={{ fill: 'var(--muted-foreground)', fontSize: 10 }}
            />
            <PolarRadiusAxis
              tick={{ fill: 'var(--muted-foreground)', fontSize: 8 }}
              domain={[0, 100]}
            />
            {visible.map((k) => (
              <Radar
                key={k}
                name={SERVERS[k].label}
                dataKey={SERVERS[k].label}
                stroke={SERVERS[k].color}
                fill={SERVERS[k].color}
                fillOpacity={0.06}
                strokeWidth={2}
              />
            ))}
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
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

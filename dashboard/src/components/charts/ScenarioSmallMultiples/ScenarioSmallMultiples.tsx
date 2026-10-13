'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SERVERS, TIER_FILL_OPACITY } from '@/lib/constants';
import { chartOrder, serverColor, serverName } from '@/lib/utils';
import type { ScenarioSmallMultiplesProps } from './ScenarioSmallMultiples.types';

// One panel per scenario, each on its own axis: scenarios differ ~30x in scale,
// so a shared axis flattens the heavy ones
export function ScenarioSmallMultiples({
  scenarios,
  visible,
  value,
  formatTick,
  formatValue,
}: ScenarioSmallMultiplesProps) {
  const keys = chartOrder(visible);

  return (
    <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
      {scenarios.map((s) => {
        const data = keys.map((k) => ({
          key: k,
          name: serverName(k),
          value: s.servers[k] ? value(s.servers[k]) : 0,
        }));

        return (
          <div key={s.id} className="min-w-0 border rounded-xl p-3 bg-card">
            <p className="text-xs font-semibold truncate">{s.name}</p>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
              {s.complexity}
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data} margin={{ left: 0, right: 4, top: 4, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis dataKey="name" hide />
                <YAxis
                  width={38}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--muted-foreground)', fontSize: 9 }}
                  tickFormatter={formatTick}
                />
                <Tooltip
                  cursor={{ fill: 'var(--muted)', opacity: 0.5 }}
                  separator=""
                  formatter={(v) => [formatValue(Number(v)), '']}
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  itemStyle={{ color: 'var(--foreground)', fontSize: 11 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={24}>
                  {data.map((d) => (
                    <Cell
                      key={d.key}
                      fill={serverColor(d.key)}
                      fillOpacity={TIER_FILL_OPACITY[SERVERS[d.key].tier]}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })}
    </div>
  );
}

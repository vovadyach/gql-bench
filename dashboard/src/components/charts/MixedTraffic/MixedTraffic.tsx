import { MixedTrafficProps } from '@/components/charts/MixedTraffic/MixedTraffic.types';
import { useMemo } from 'react';
import { SERVERS } from '@/lib/constants';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { calcPercentage, cn, formatReqPerSec } from '@/lib/utils';
import { AnimatedNumber } from '@/components/shared/AnimatedNumber/AnimatedNumber';
import { Crown } from 'lucide-react';

export function MixedTraffic({ data, visible }: MixedTrafficProps) {
  if (!data) return null;

  const chartData = useMemo(() => {
    const row: Record<string, string | number> = { name: 'Mixed Traffic' };
    visible.forEach((k) => {
      row[SERVERS[k].label] = data[k]?.requests?.rate || 0;
    });
    return [row];
  }, [data, visible]);

  const scenario = {
    servers: data,
    id: 'mixed',
    name: 'Mixed Traffic',
    complexity: 'medium' as const,
  };
  const winner = visible.reduce(
    (best, k) => ((data[k]?.requests?.rate || 0) > (data[best]?.requests?.rate || 0) ? k : best),
    visible[0],
  );

  const slowest = visible.reduce(
    (worst, k) => ((data[k]?.requests?.rate || 0) < (data[worst]?.requests?.rate || 0) ? k : worst),
    visible[0],
  );

  const slowestRate = data[slowest]?.requests?.rate || 0;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Mixed Traffic</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Production-like query mix — 60% light, 25% medium, 15% heavy
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        {Object.entries(SERVERS).map(([key, server]) => {
          const isOn = visible.includes(key);
          const d = data[key];
          if (!d) return null;
          const isWinner = key === winner;
          const pct = calcPercentage(d.requests.rate, slowestRate);

          return (
            <div
              key={key}
              className={`rounded-xl border p-4 bg-card relative ${!isOn ? 'opacity-40' : ''}`}
              style={{
                borderColor: isOn ? `var(--server-${key})` : 'var(--border)',
                backgroundColor: isOn
                  ? `color-mix(in srgb, var(--server-${key}) 5%, var(--card))`
                  : undefined,
              }}
            >
              {isWinner && isOn && (
                <div
                  className={cn(
                    'absolute top-3 right-3 rounded-full border border-border/60 bg-background/90 p-1.5 shadow-md backdrop-blur-sm',
                    !(isWinner && isOn) && 'invisible',
                  )}
                >
                  <Crown
                    className="h-4 w-4 text-foreground/80 dark:text-amber-400"
                    strokeWidth={2.2}
                  />
                </div>
              )}
              <span className="text-xs font-bold" style={{ color: `var(--server-${key})` }}>
                {server.label}
              </span>
              <div
                className="text-xl font-extrabold font-mono tabular-nums mt-1"
                style={{ color: `var(--server-${key})` }}
              >
                <AnimatedNumber value={d.requests.rate} />
                <span className="text-xs text-muted-foreground ml-1">req/s</span>
              </div>
              {isOn && visible.length > 1 && key !== slowest && (
                <p className="text-xs font-bold mt-1" style={{ color: `var(--server-${key})` }}>
                  +{pct}% vs slowest
                </p>
              )}
              {isOn && key === slowest && visible.length > 1 && (
                <p className="text-xs text-muted-foreground mt-1">baseline</p>
              )}
              <div className="flex gap-3 mt-2 text-xs text-muted-foreground font-mono tabular-nums">
                <span>avg {d.latency_ms.avg}ms</span>
                <span>p99 {d.latency_ms.p99}ms</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border rounded-xl p-4 bg-card">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData} barGap={4}>
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

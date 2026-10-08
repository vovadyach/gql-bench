'use client';

import { SERVERS } from '@/lib/constants';
import { getWinner, calcPercentage, getSlowest, formatNumber } from '@/lib/utils';
import type { RawDataTableProps } from './RawDataTable.types';
import { HEADERS } from '@/components/sections/RawDataTable/RawDataTable.constants';
import { Crown } from 'lucide-react';
import { Fragment } from 'react';

export default function RawDataTable({ scenario, visible }: RawDataTableProps) {
  const winner = getWinner(scenario, visible);
  const slowest = getSlowest(scenario, visible);
  const slowestRate = scenario.servers[slowest]?.requests?.rate || 0;

  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">
        Raw Data —{' '}
        <span style={{ color: `var(--complexity-${scenario.complexity})` }}>{scenario.name}</span>
      </h2>
      <p className="text-xs text-muted-foreground mb-4">All numbers for the selected scenario</p>
      <div className="border rounded-xl bg-card overflow-x-auto">
        <table className="w-full text-xs min-w-[640px]">
          <thead>
            <tr className="border-b">
              {HEADERS.map((h) => (
                <th
                  key={h}
                  className="px-3 py-3 text-muted-foreground font-semibold tracking-wide"
                  style={{ textAlign: h === 'Framework' ? 'left' : 'right', fontSize: 10 }}
                >
                  {h.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {['nestjs', 'raw'].map((tier) => {
              const tierServers = Object.entries(SERVERS).filter(
                ([key, s]) => s.tier === tier && visible.includes(key),
              );

              if (!tierServers.length) return null;

              const tierNames: Record<string, string> = {
                nestjs: 'NestJS',
                raw: 'Direct · without NestJS',
                standalone: 'Standalone',
              };

              return (
                <Fragment key={tier}>
                  <tr>
                    <td
                      colSpan={9}
                      className="text-[9px] uppercase tracking-widest text-muted-foreground pt-4 pb-1 px-3 border-t border-border first:border-t-0"
                    >
                      {tierNames[tier]}
                    </td>
                  </tr>
                  {tierServers.map(([key, server]) => {
                    const data = scenario.servers[key];
                    if (!data) return null;

                    const isWinner = key === winner;
                    const pct =
                      key === slowest
                        ? 'baseline'
                        : `+${calcPercentage(data.requests.rate, slowestRate)}%`;

                    return (
                      <tr
                        key={key}
                        className="border-b last:border-0"
                        style={{
                          backgroundColor: isWinner
                            ? `color-mix(in srgb, var(--server-${key}) 5%, transparent)`
                            : undefined,
                        }}
                      >
                        <td
                          className="px-3 py-3 font-bold"
                          style={{ color: `var(--server-${key})` }}
                        >
                          <div className="inline-flex items-center gap-1">
                            {server.label}{' '}
                            {isWinner && (
                              <Crown
                                className="h-3 w-3 text-foreground/80 dark:text-amber-400"
                                strokeWidth={2.2}
                              />
                            )}
                          </div>
                        </td>
                        <td
                          className="px-3 py-3 text-right font-extrabold font-mono tabular-nums"
                          style={{ color: `var(--server-${key})` }}
                        >
                          {formatNumber(data.requests.rate)}
                        </td>
                        <td
                          className="px-3 py-3 text-right font-bold font-mono tabular-nums"
                          style={{
                            color:
                              pct === 'baseline'
                                ? 'var(--muted-foreground)'
                                : pct.startsWith('+')
                                  ? '#00e676'
                                  : '#ff4757',
                          }}
                        >
                          {pct}
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground font-mono tabular-nums">
                          {data.latency_ms.avg}ms
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          {data.latency_ms.med}ms
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          {data.latency_ms.p90}ms
                        </td>
                        <td className="px-3 py-3 text-right font-mono tabular-nums">
                          {data.latency_ms.p95}ms
                        </td>
                        <td className="px-3 py-3 text-right font-bold font-mono tabular-nums">
                          {data.latency_ms.p99}ms
                        </td>
                        <td className="px-3 py-3 text-right text-muted-foreground font-mono tabular-nums">
                          {data.latency_ms.max}ms
                        </td>
                      </tr>
                    );
                  })}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

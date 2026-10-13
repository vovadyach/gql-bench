'use client';

import { ChartLegend } from '@/components/charts/ChartLegend/ChartLegend';
import { ScenarioSmallMultiples } from '@/components/charts/ScenarioSmallMultiples/ScenarioSmallMultiples';
import type { P99ChartProps } from './P99Chart.types';

export default function P99Chart({ scenarios, visible }: P99ChartProps) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">p99 Latency by Scenario</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Worst 1% of requests, lower is better — each scenario on its own scale
      </p>
      <ChartLegend visible={visible} />
      <ScenarioSmallMultiples
        scenarios={scenarios}
        visible={visible}
        value={(r) => r.latency_ms.p99}
        formatTick={(n) => `${n}ms`}
        formatValue={(n) => `${n} ms p99`}
      />
    </div>
  );
}

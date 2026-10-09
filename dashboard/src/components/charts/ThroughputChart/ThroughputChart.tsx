'use client';

import { ChartLegend } from '@/components/charts/ChartLegend/ChartLegend';
import { ScenarioSmallMultiples } from '@/components/charts/ScenarioSmallMultiples/ScenarioSmallMultiples';
import { formatNumber, formatReqPerSec } from '@/lib/utils';
import type { ThroughputChartProps } from './ThroughputChart.types';

export function ThroughputChart({ scenarios, visible }: ThroughputChartProps) {
  return (
    <div className="mb-8">
      <h2 className="text-sm font-bold mb-1">Throughput by Scenario</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Requests per second, higher is better — each scenario on its own scale
      </p>
      <ChartLegend visible={visible} />
      <ScenarioSmallMultiples
        scenarios={scenarios}
        visible={visible}
        value={(r) => r.requests.rate}
        formatTick={formatReqPerSec}
        formatValue={(n) => `${formatNumber(n)} req/s`}
      />
    </div>
  );
}

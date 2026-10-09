import { Scenario, ServerResult } from '@/lib/types';

export interface ScenarioSmallMultiplesProps {
  scenarios: Scenario[];
  visible: string[];
  value: (result: ServerResult) => number;
  formatTick: (n: number) => string;
  formatValue: (n: number) => string;
}

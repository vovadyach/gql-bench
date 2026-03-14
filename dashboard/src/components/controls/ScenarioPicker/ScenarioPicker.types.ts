import { Scenario } from '@/lib/types';

export interface ScenarioPickerProps {
  scenarios: Scenario[];
  active: number;
  onChange: (index: number) => void;
}

import quickData from './quick-data.json';
import standardData from './data-standard.json';
import type { BenchmarkData } from './types';

export const PROFILES: Record<string, BenchmarkData> = {
  quick: quickData as unknown as BenchmarkData,
  standard: standardData as unknown as BenchmarkData,
};

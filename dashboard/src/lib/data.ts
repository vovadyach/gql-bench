import quickData from './quick-data_m1_median.json';
import standardData from './standard-data_m1_median.json';
import type { BenchmarkData } from './types';

export const PROFILES: Record<string, BenchmarkData> = {
  quick: quickData as unknown as BenchmarkData,
  standard: standardData as unknown as BenchmarkData,
};

import quickData from './quick-data_v3.json';
import standardData from './standard-data_v6.json';
import type { BenchmarkData } from './types';

export const PROFILES: Record<string, BenchmarkData> = {
  quick: quickData as unknown as BenchmarkData,
  standard: standardData as unknown as BenchmarkData,
};

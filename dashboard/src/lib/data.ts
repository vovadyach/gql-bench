import quickData from './quick-data2.json';
import standardData from './standard-data2.json';
import type { BenchmarkData } from './types';

export const PROFILES: Record<string, BenchmarkData> = {
  quick: quickData as unknown as BenchmarkData,
  standard: standardData as unknown as BenchmarkData,
};

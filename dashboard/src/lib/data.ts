import rawData from './data.json';
import type { BenchmarkData } from './types';

export const BENCHMARK_DATA = rawData as BenchmarkData;

export const PROFILES: Record<string, BenchmarkData> = {
  quick: rawData as unknown as BenchmarkData,
  standard: rawData as unknown as BenchmarkData,
};

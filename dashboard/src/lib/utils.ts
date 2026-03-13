import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Scenario } from '@/lib/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Calculate percentage difference
export function calcPercentage(rate: number, baseline: number): number {
  if (baseline === 0) return 0;
  return Math.round(((rate - baseline) / baseline) * 100);
}

// Format number: 14108 → "14,108"
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString();
}

// Format for chart axis: 14108 → "14k"
export function formatReqPerSec(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(0)}k`;
  return String(n);
}

// Find fastest server in a scenario
export function getWinner(scenario: Scenario, visible: string[]): string {
  let best = visible[0];
  let bestRate = 0;
  visible.forEach((k) => {
    const rate = scenario.servers[k]?.rate || 0;
    if (rate > bestRate) {
      best = k;
      bestRate = rate;
    }
  });
  return best;
}

// Find slowest server in a scenario
export function getSlowest(scenario: Scenario, visible: string[]): string {
  let worst = visible[0];
  let worstRate = Infinity;
  visible.forEach((k) => {
    const rate = scenario.servers[k]?.rate || 0;
    if (rate < worstRate) {
      worst = k;
      worstRate = rate;
    }
  });
  return worst;
}

// Format date: ISO string → "March 12, 2026"
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

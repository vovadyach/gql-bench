import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Finding, Scenario } from '@/lib/types';
import { SERVERS } from '@/lib/constants';
import { Gauge, Database, ArrowLeftRight, SquarePen } from 'lucide-react';

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
    const rate = scenario.servers[k]?.requests?.rate || 0;
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
    const rate = scenario.servers[k]?.requests?.rate || 0;
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

export function generateFindings(scenarios: Scenario[], visible: string[]): Finding[] {
  const findings: Finding[] = [];
  if (visible.length < 2) return findings;

  // Find who wins most scenarios
  const wins: Record<string, number> = {};
  visible.forEach((k) => {
    wins[k] = 0;
  });

  scenarios.forEach((s) => {
    let bestKey = visible[0];
    let bestRate = 0;
    visible.forEach((k) => {
      const rate = s.servers[k]?.requests?.rate || 0;
      if (rate > bestRate) {
        bestRate = rate;
        bestKey = k;
      }
    });
    wins[bestKey]++;
  });

  const topWinner = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
  const winnerKey = topWinner[0];
  const winnerLabel = SERVERS[winnerKey]?.short || winnerKey;

  // 1. Overall winner
  const healthScenario = scenarios.find((s) => s.id === 'health');
  const heavyScenario = scenarios.find(
    (s) => s.complexity === 'extreme' || s.complexity === 'heavy',
  );
  const slowestHealth = Math.min(
    ...visible.map((k) => healthScenario?.servers[k]?.requests?.rate || 0),
  );
  const fastestHealth = Math.max(
    ...visible.map((k) => healthScenario?.servers[k]?.requests?.rate || 0),
  );
  const healthPct =
    slowestHealth > 0 ? Math.round(((fastestHealth - slowestHealth) / slowestHealth) * 100) : 0;

  findings.push({
    icon: Gauge,
    title: `${winnerLabel} wins ${topWinner[1]} of ${scenarios.length} scenarios`,
    desc: `Up to ${healthPct}% faster than slowest on light queries`,
    color: SERVERS[winnerKey]?.color || '#00b0ff',
  });

  // 2. Find who loses on heavy queries
  if (heavyScenario) {
    let worstKey = visible[0];
    let worstRate = Infinity;
    visible.forEach((k) => {
      const rate = heavyScenario.servers[k]?.requests?.rate || 0;
      if (rate < worstRate) {
        worstRate = rate;
        worstKey = k;
      }
    });
    const bestHeavyRate = Math.max(
      ...visible.map((k) => heavyScenario.servers[k]?.requests?.rate || 0),
    );
    const heavyPct = Math.round(((bestHeavyRate - worstRate) / worstRate) * 100);
    const worstLabel = SERVERS[worstKey]?.short || worstKey;

    findings.push({
      icon: Database,
      title: `${worstLabel} slowest on heavy queries`,
      desc: `${heavyPct}% behind fastest on ${heavyScenario.name}`,
      color: SERVERS[worstKey]?.color || '#ff4757',
    });
  }

  // 3. Mutation winner (if mutation scenario exists)
  const mutation = scenarios.find((s) => s.id === 'mutation');
  if (mutation) {
    let mutWinner = visible[0];
    let mutBest = 0;
    let mutLoser = visible[0];
    let mutWorst = Infinity;
    visible.forEach((k) => {
      const rate = mutation.servers[k]?.requests?.rate || 0;
      if (rate > mutBest) {
        mutBest = rate;
        mutWinner = k;
      }
      if (rate < mutWorst) {
        mutWorst = rate;
        mutLoser = k;
      }
    });
    const mutPct = Math.round(((mutBest - mutWorst) / mutWorst) * 100);

    findings.push({
      icon: SquarePen,
      title: `Mutations: ${SERVERS[mutWinner]?.short} wins`,
      desc: `${SERVERS[mutLoser]?.short} is ${mutPct}% slower on writes`,
      color: SERVERS[mutWinner]?.color || '#00e676',
    });
  }

  // 4. Gap shrinks under load
  if (healthScenario && heavyScenario) {
    const heavySlowest = Math.min(
      ...visible.map((k) => heavyScenario.servers[k]?.requests?.rate || 0),
    );
    const heavyFastest = Math.max(
      ...visible.map((k) => heavyScenario.servers[k]?.requests?.rate || 0),
    );
    const heavyGap =
      heavySlowest > 0 ? Math.round(((heavyFastest - heavySlowest) / heavySlowest) * 100) : 0;

    findings.push({
      icon: ArrowLeftRight,
      title: 'Gap shrinks under load',
      desc: `${healthPct}% on ${healthScenario.name} → ${heavyGap}% on ${heavyScenario.name}. Framework matters less as queries grow`,
      color: '#ffa726',
    });
  }

  return findings;
}

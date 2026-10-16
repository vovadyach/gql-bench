import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Finding, Scenario, ServerResult } from '@/lib/types';
import { SERVERS, TIER_LABELS } from '@/lib/constants';
import { Gauge, Database, ArrowLeftRight, SquarePen, Layers, Languages } from 'lucide-react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Short tag shown next to a label: "NestJS" / "Direct", or the language for other languages
export function tierLabel(key: string): string {
  const server = SERVERS[key];
  if (!server) return '';
  return server.lang ?? TIER_LABELS[server.tier];
}

// Label for places without a tier tag: "Express + Apollo", "Python · FastAPI + Strawberry"
export function serverLabel(key: string): string {
  const server = SERVERS[key];
  if (!server) return key;
  return server.lang ? `${server.lang} · ${server.label}` : server.label;
}

// Tier-qualified name: "NestJS Express + Apollo" / "Direct Fastify + Mercurius" /
// "Python FastAPI + Strawberry"
export function serverName(key: string): string {
  const server = SERVERS[key];
  if (!server) return key;
  return `${tierLabel(key)} ${server.label}`;
}

// Node.js servers (NestJS and direct); other languages are compared against them
export function isNodeServer(key: string): boolean {
  return SERVERS[key] !== undefined && SERVERS[key].tier !== 'other';
}

// Fastest Node.js server in one result set, whether or not it's visible, so the
// reference for other languages doesn't move when Node servers are toggled
export function fastestNode(
  results: Record<string, ServerResult>,
): { key: string; rate: number } | null {
  let best: { key: string; rate: number } | null = null;
  for (const key of Object.keys(results)) {
    const rate = results[key]?.requests?.rate;
    if (isNodeServer(key) && rate && (!best || rate > best.rate)) best = { key, rate };
  }
  return best;
}

// req/s as a multiple of the fastest Node server: 0.05 means 20× slower
export function vsFastestNode(results: Record<string, ServerResult>, key: string): number | null {
  const rate = results[key]?.requests?.rate;
  const fastest = fastestNode(results);
  if (!rate || !fastest) return null;
  return rate / fastest.rate;
}

// 0.05 → "20× slower", 1.6 → "1.6× faster", 0.8 → "−20%" (close gaps read better as %)
export function formatRatio(ratio: number): string {
  if (ratio > 0.5 && ratio < 2) return formatSignedPct((ratio - 1) * 100);
  const factor = ratio >= 1 ? ratio : 1 / ratio;
  const rounded = factor >= 10 ? Math.round(factor) : parseFloat(factor.toFixed(1));
  return `${rounded}× ${ratio >= 1 ? 'faster' : 'slower'}`;
}

// Theme-aware server color (defined per theme in globals.css)
export function serverColor(key: string): string {
  return `var(--server-${key})`;
}

// Chart series order: each NestJS server followed by its direct twin, then direct-only servers
export function chartOrder(visible: string[]): string[] {
  const keys = Object.keys(SERVERS);
  const paired = keys.flatMap((k) =>
    SERVERS[k].tier === 'nestjs' ? [k, ...keys.filter((d) => SERVERS[d].nestjsTwin === k)] : [],
  );
  return [...paired, ...keys.filter((k) => !paired.includes(k))].filter((k) => visible.includes(k));
}

// Direct server vs its NestJS twin in one result set: +33 means 33% more req/s without NestJS
export function nestjsDelta(results: Record<string, ServerResult>, key: string): number | null {
  const twin = SERVERS[key]?.nestjsTwin;
  const direct = results[key]?.requests?.rate;
  const nestjs = twin ? results[twin]?.requests?.rate : undefined;
  if (!direct || !nestjs) return null;
  return ((direct - nestjs) / nestjs) * 100;
}

// 33.4 → "+33%", -17 → "−17%"
export function formatSignedPct(n: number): string {
  const rounded = Math.round(n);
  return `${rounded > 0 ? '+' : rounded < 0 ? '−' : '±'}${Math.abs(rounded)}%`;
}

// Calculate percentage difference
export function calcPercentage(rate: number, baseline: number): number {
  if (baseline === 0) return 0;
  return Math.round(((rate - baseline) / baseline) * 100);
}

// Format number: 14108 → "14,108"
// Fixed locale: the page is prerendered, so the visitor's locale would mismatch on hydration
export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

// Format for chart axis: 14108 → "14.1k", 2500 → "2.5k"
export function formatReqPerSec(n: number): string {
  if (n >= 1000) return `${parseFloat((n / 1000).toFixed(1))}k`;
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
  // Node findings compare Node servers with each other; other languages get their own below
  return [
    ...nodeFindings(
      scenarios,
      visible.filter((k) => isNodeServer(k)),
    ),
    ...visible
      .filter((k) => SERVERS[k] && !isNodeServer(k))
      .flatMap((k) => languageFinding(scenarios, k) ?? []),
  ];
}

// "Python FastAPI + Strawberry vs the fastest Node server: health 19× slower · …"
function languageFinding(scenarios: Scenario[], key: string): Finding | null {
  const parts = scenarios.flatMap((s) => {
    const ratio = vsFastestNode(s.servers, key);
    return ratio === null ? [] : [`${s.name} ${formatRatio(ratio)}`];
  });
  if (!parts.length) return null;

  return {
    icon: Languages,
    title: `${serverName(key)} vs the fastest Node server`,
    desc: parts.join(' · '),
    color: serverColor(key),
  };
}

function nodeFindings(scenarios: Scenario[], visible: string[]): Finding[] {
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

  // 0. Headline: the same stack with and without NestJS, across every scenario
  const twins = visible.filter((k) => {
    const twin = SERVERS[k]?.nestjsTwin;
    return twin !== undefined && visible.includes(twin);
  });
  const deltas = scenarios.flatMap((s) =>
    twins.map((k) => nestjsDelta(s.servers, k)).filter((d): d is number => d !== null),
  );
  if (deltas.length) {
    const avg = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    findings.push({
      icon: Layers,
      title: `Without NestJS: ${formatSignedPct(avg)} req/s on average`,
      desc: `Same stack with and without NestJS, ${deltas.length} comparisons across ${scenarios.length} scenarios (${formatSignedPct(Math.min(...deltas))} to ${formatSignedPct(Math.max(...deltas))})`,
      color: 'var(--muted-foreground)',
      wide: true,
    });
  }

  const topWinner = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
  const winnerKey = topWinner[0];
  const winnerLabel = serverName(winnerKey);

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
    color: serverColor(winnerKey),
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
    // "behind fastest" is measured against the fastest, not the slowest
    const heavyPct = Math.round(((bestHeavyRate - worstRate) / bestHeavyRate) * 100);
    const worstLabel = serverName(worstKey);

    findings.push({
      icon: Database,
      title: `${worstLabel} slowest on heavy queries`,
      desc: `${heavyPct}% behind fastest on ${heavyScenario.name}`,
      color: serverColor(worstKey),
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
    // "N% slower" is measured against the winner's rate
    const mutPct = Math.round(((mutBest - mutWorst) / mutBest) * 100);

    findings.push({
      icon: SquarePen,
      title: `Mutations: ${serverName(mutWinner)} wins`,
      desc: `${serverName(mutLoser)} is ${mutPct}% slower on writes`,
      color: serverColor(mutWinner),
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

    const shrinks = heavyGap < healthPct;
    findings.push({
      icon: ArrowLeftRight,
      title: shrinks ? 'Gap shrinks under load' : 'Gap grows under load',
      desc: `Fastest vs slowest: ${healthPct}% on ${healthScenario.name} → ${heavyGap}% on ${heavyScenario.name}. ${
        shrinks
          ? 'Framework matters less as queries grow'
          : 'Framework matters more as queries grow'
      }`,
      color: 'var(--complexity-heavy)',
    });
  }

  return findings;
}

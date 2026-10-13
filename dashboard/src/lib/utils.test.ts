import { describe, expect, it } from 'vitest';
import type { Scenario, ServerResult } from '@/lib/types';
import { chartOrder, formatSignedPct, generateFindings, nestjsDelta } from '@/lib/utils';
import { SERVER_KEYS } from '@/lib/constants';

const result = (rate: number) => ({ requests: { total: 0, rate } }) as unknown as ServerResult;
const scenario = (id: string, complexity: Scenario['complexity'], rates: Record<string, number>) =>
  ({
    id,
    name: id,
    complexity,
    servers: Object.fromEntries(Object.entries(rates).map(([k, r]) => [k, result(r)])),
  }) as Scenario;

describe('chartOrder', () => {
  it('puts each NestJS server next to its direct twin, then direct-only servers', () => {
    expect(chartOrder(SERVER_KEYS)).toEqual([
      'express',
      'raw-express-apollo',
      'fastify',
      'raw-fastify-apollo',
      'mercurius',
      'raw-fastify-mercurius',
      'yoga',
      'raw-fastify-yoga',
      'raw-express-yoga',
      'yoga-standalone',
    ]);
  });

  it('keeps only visible servers', () => {
    expect(chartOrder(['yoga-standalone', 'raw-fastify-apollo', 'express'])).toEqual([
      'express',
      'raw-fastify-apollo',
      'yoga-standalone',
    ]);
  });
});

describe('nestjsDelta', () => {
  it('compares a direct server with the same stack under NestJS', () => {
    const results = { express: result(4000), 'raw-express-apollo': result(5000) };
    expect(nestjsDelta(results, 'raw-express-apollo')).toBe(25);
    expect(formatSignedPct(25)).toBe('+25%');
    expect(formatSignedPct(-17.4)).toBe('−17%');
  });

  it('has no delta for NestJS servers or stacks without a NestJS version', () => {
    const results = { express: result(4000), 'yoga-standalone': result(9000) };
    expect(nestjsDelta(results, 'express')).toBeNull();
    expect(nestjsDelta(results, 'yoga-standalone')).toBeNull();
  });
});

describe('generateFindings', () => {
  const visible = ['express', 'raw-express-apollo'];
  const scenarios = [
    scenario('health', 'light', { express: 4000, 'raw-express-apollo': 5000 }),
    scenario('user-list', 'heavy', { express: 1000, 'raw-express-apollo': 1600 }),
    scenario('mutation', 'medium', { express: 5000, 'raw-express-apollo': 10000 }),
  ];
  const findings = generateFindings(scenarios, visible);

  it('leads with what NestJS costs, averaged across scenarios', () => {
    // +25%, +60%, +100% → +62%
    expect(findings[0].title).toBe('Without NestJS: +62% req/s on average');
    expect(findings[0].wide).toBe(true);
  });

  it('measures "slower" and "behind" against the faster server', () => {
    const titles = findings.map((f) => `${f.title} | ${f.desc}`).join('\n');
    expect(titles).toContain('NestJS Express + Apollo is 50% slower on writes');
    expect(titles).toContain('38% behind fastest on user-list');
  });

  it('says the gap grows when the heavy-query gap is larger', () => {
    // 25% on health → 60% on user-list
    expect(findings.map((f) => f.title)).toContain('Gap grows under load');
  });
});

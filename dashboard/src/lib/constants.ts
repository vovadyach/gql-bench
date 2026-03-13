import type { ServerConfig, Theme, Finding } from './types';

// Server configurations
export const SERVERS: Record<string, ServerConfig> = {
  express: {
    key: 'express',
    label: 'Express + Apollo',
    short: 'Express',
    color: '#ff4757',
    glow: 'rgba(255,71,87,.10)',
  },
  fastify: {
    key: 'fastify',
    label: 'Fastify + Apollo',
    short: 'Fastify',
    color: '#00e676',
    glow: 'rgba(0,230,118,.10)',
  },
  mercurius: {
    key: 'mercurius',
    label: 'Fastify + Mercurius',
    short: 'Mercurius',
    color: '#00b0ff',
    glow: 'rgba(0,176,255,.10)',
  },
};

export const SERVER_KEYS = Object.keys(SERVERS);

// Complexity colors for scenario badges
export const COMPLEXITY_COLORS: Record<string, string> = {
  light: '#00e676',
  medium: '#00b0ff',
  heavy: '#ffa726',
  extreme: '#ff4757',
};

// Coming soon languages
export const COMING_SOON = [
  { lang: 'Go', frameworks: 'chi · Gin · Fiber', color: '#00d4ff' },
  { lang: 'C#', frameworks: '.NET + Hot Chocolate', color: '#bf5af2' },
  { lang: 'Java', frameworks: 'Spring + Netflix DGS', color: '#ff8a2b' },
];

// Key findings (hardcoded for now, auto-generate later)
export const KEY_FINDINGS: Finding[] = [
  {
    icon: '🏆',
    title: 'Mercurius dominates reads',
    desc: '31–113% faster than Express on all query types',
    color: '#00b0ff',
  },
  {
    icon: '⚡',
    title: 'Fastify loses on heavy queries',
    desc: '4–11% SLOWER than Express on deep/paginated queries',
    color: '#00e676',
  },
  {
    icon: '✍️',
    title: 'Mutations: Fastify wins',
    desc: 'Mercurius 5% slower on writes — use Fastify+Apollo for write-heavy APIs',
    color: '#00e676',
  },
  {
    icon: '📉',
    title: 'Gap shrinks under load',
    desc: '113% on health → 31% on deep nested. Framework matters less as queries grow',
    color: '#ffa726',
  },
];

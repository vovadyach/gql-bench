import type { ServerConfig } from './types';

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
  yoga: {
    key: 'yoga',
    label: 'Fastify + Yoga',
    short: 'Yoga',
    color: '#a855f7',
    glow: 'rgba(168,85,247,.10)',
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

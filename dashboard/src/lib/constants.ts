import type { ServerConfig } from './types';

// Server registry. Colors live in globals.css as --server-<key>: a NestJS server and its
// direct twin share a color, and the tier (solid vs faded) tells them apart.
export const SERVERS: Record<string, ServerConfig> = {
  express: {
    key: 'express',
    label: 'Express + Apollo',
    tier: 'nestjs',
  },
  fastify: {
    key: 'fastify',
    label: 'Fastify + Apollo',
    tier: 'nestjs',
  },
  mercurius: {
    key: 'mercurius',
    label: 'Fastify + Mercurius',
    tier: 'nestjs',
  },
  yoga: {
    key: 'yoga',
    label: 'Fastify + Yoga',
    tier: 'nestjs',
  },
  // Direct (without NestJS)
  'raw-express-apollo': {
    key: 'raw-express-apollo',
    label: 'Express + Apollo',
    tier: 'raw',
    nestjsTwin: 'express',
  },
  'raw-express-yoga': {
    key: 'raw-express-yoga',
    label: 'Express + Yoga',
    tier: 'raw',
  },
  'raw-fastify-apollo': {
    key: 'raw-fastify-apollo',
    label: 'Fastify + Apollo',
    tier: 'raw',
    nestjsTwin: 'fastify',
  },
  'raw-fastify-mercurius': {
    key: 'raw-fastify-mercurius',
    label: 'Fastify + Mercurius',
    tier: 'raw',
    nestjsTwin: 'mercurius',
  },
  'raw-fastify-yoga': {
    key: 'raw-fastify-yoga',
    label: 'Fastify + Yoga',
    tier: 'raw',
    nestjsTwin: 'yoga',
  },
  // Standalone
  'yoga-standalone': {
    key: 'yoga-standalone',
    label: 'Yoga Standalone',
    tier: 'raw',
  },
};

export const SERVER_KEYS = Object.keys(SERVERS);

// Labels repeat across tiers ("Express + Apollo" exists in both), so the tier tag disambiguates
export const TIER_LABELS: Record<ServerConfig['tier'], string> = {
  nestjs: 'NestJS',
  raw: 'Direct',
  standalone: 'Standalone',
};

// Chart fills: solid for NestJS, faded for direct, so twins sharing a color stay distinct
export const TIER_FILL_OPACITY: Record<ServerConfig['tier'], number> = {
  nestjs: 1,
  raw: 0.5,
  standalone: 0.5,
};

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

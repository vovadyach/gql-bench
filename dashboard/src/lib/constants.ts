import type { ServerConfig } from './types';

// Server configurations
export const SERVERS: Record<string, ServerConfig> = {
  express: {
    key: 'express',
    label: 'Express + Apollo',
    short: 'Express',
    color: '#ff4757',
    glow: 'rgba(255,71,87,.10)',
    tier: 'nestjs',
    opacity: 1,
  },
  fastify: {
    key: 'fastify',
    label: 'Fastify + Apollo',
    short: 'Fastify',
    color: '#00e676',
    glow: 'rgba(0,230,118,.10)',
    tier: 'nestjs',
    opacity: 1,
  },
  mercurius: {
    key: 'mercurius',
    label: 'Fastify + Mercurius',
    short: 'Mercurius',
    color: '#00b0ff',
    glow: 'rgba(0,176,255,.10)',
    tier: 'nestjs',
    opacity: 1,
  },
  yoga: {
    key: 'yoga',
    label: 'Fastify + Yoga',
    short: 'Yoga',
    color: '#a855f7',
    glow: 'rgba(168,85,247,.10)',
    tier: 'nestjs',
    opacity: 1,
  },
  // Raw
  'raw-express-apollo': {
    key: 'raw-express-apollo',
    label: 'Express + Apollo',
    short: 'Express+Apollo',
    color: '#ff4757',
    glow: 'rgba(255,71,87,.10)',
    tier: 'raw',
    opacity: 0.65,
  },
  'raw-express-yoga': {
    key: 'raw-express-yoga',
    label: 'Express + Yoga',
    short: 'Express+Yoga',
    color: '#a855f7',
    glow: 'rgba(168,85,247,.10)',
    tier: 'raw',
    opacity: 0.65,
  },
  'raw-fastify-apollo': {
    key: 'raw-fastify-apollo',
    label: 'Fastify + Apollo',
    short: 'Fastify+Apollo',
    color: '#00e676',
    glow: 'rgba(0,230,118,.10)',
    tier: 'raw',
    opacity: 0.65,
  },
  'raw-fastify-mercurius': {
    key: 'raw-fastify-mercurius',
    label: 'Fastify + Mercurius',
    short: 'Mercurius',
    color: '#00b0ff',
    glow: 'rgba(0,176,255,.10)',
    tier: 'raw',
    opacity: 0.65,
  },
  'raw-fastify-yoga': {
    key: 'raw-fastify-yoga',
    label: 'Fastify + Yoga',
    short: 'Fastify+Yoga',
    color: '#a855f7',
    glow: 'rgba(168,85,247,.10)',
    tier: 'raw',
    opacity: 0.65,
  },
  // Standalone
  'yoga-standalone': {
    key: 'yoga-standalone',
    label: 'Yoga Standalone',
    short: 'Yoga Standalone',
    color: '#a855f7',
    glow: 'rgba(168,85,247,.10)',
    tier: 'raw',
    opacity: 0.45,
  },
};

export const SERVER_KEYS = Object.keys(SERVERS);

// Labels repeat across tiers ("Express + Apollo" exists in both), so the tier tag disambiguates
export const TIER_LABELS: Record<ServerConfig['tier'], string> = {
  nestjs: 'NestJS',
  raw: 'Direct',
  standalone: 'Standalone',
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

// MIXED TRAFFIC — What real production looks like.
//
// Instead of testing one query at a time, this simulates
// realistic traffic where different users hit different endpoints
// simultaneously. Each virtual user randomly picks a query
// based on real-world probability distribution.

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const SERVER = __ENV.SERVER || 'http://localhost:3001';
const PROFILE = __ENV.PROFILE || 'standard';

const lightRate = new Trend('light_query_duration');
const mediumRate = new Trend('medium_query_duration');
const heavyRate = new Trend('heavy_query_duration');
const extremeRate = new Trend('extreme_query_duration');
const mutationRate = new Trend('mutation_query_duration');
const gqlErrors = new Rate('graphql_errors');
const queryCount = new Counter('queries_by_type');

// ─── Query Definitions With Weights ────────────────────
// Weights reflect real production traffic distribution.

const QUERIES = [
  {
    name: 'health',
    weight: 30, // 30% of traffic = health checks, simple lookups
    type: 'light',
    query: '{ health { status adapter uptimeSeconds timestamp } }',
  },
  {
    name: 'single-user',
    weight: 25, // 25% = detail page views
    type: 'medium',
    query:
      '{ user(id: 1) { id name email role posts { id title status viewCount comments { id body likes } } stats { totalPosts avgRating totalViews } } }',
  },
  {
    name: 'mutation',
    weight: 20, // 20% = write operations
    type: 'mutation',
    query:
      'mutation { createPost(userId: 1, input: { title: "User Post", body: "Content from a real user interaction", tags: ["user", "content"] }) { id title status createdAt } }',
  },
  {
    name: 'user-list',
    weight: 15, // 15% = list/search pages
    type: 'heavy',
    query:
      '{ users(page: 1, pageSize: 10) { items { id name role posts { id title rating comments { id body } } stats { totalPosts avgRating } } total hasMore } }',
  },
  {
    name: 'deep-nested',
    weight: 10, // 10% = admin dashboards, reports
    type: 'extreme',
    query:
      '{ deepNested(count: 3) { id name email posts { id title body status tags viewCount rating comments { id body authorName likes } } stats { totalPosts totalComments avgRating totalViews } } }',
  },
];

// Build weighted selection array
const WEIGHTED = [];
for (const q of QUERIES) {
  for (let i = 0; i < q.weight; i++) {
    WEIGHTED.push(q);
  }
}

// ─── Load Profile ──────────────────────────────────────

const PROFILES = {
  quick: [
    { duration: '3s', target: 10 },
    { duration: '10s', target: 10 },
    { duration: '3s', target: 0 },
  ],
  standard: [
    { duration: '10s', target: 50 },
    { duration: '30s', target: 50 },
    { duration: '5s', target: 0 },
  ],
  stress: [
    { duration: '10s', target: 50 },
    { duration: '15s', target: 50 },
    { duration: '10s', target: 100 },
    { duration: '15s', target: 100 },
    { duration: '10s', target: 200 },
    { duration: '15s', target: 200 },
    { duration: '10s', target: 0 },
  ],
};

export const options = {
  scenarios: {
    mixed_traffic: {
      executor: 'ramping-vus',
      startVUs: 0,
      gracefulRampDown: '5s',
      stages: PROFILES[PROFILE] || PROFILES.standard,
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<1000', 'p(99)<2000'],
    http_req_failed: ['rate<0.05'],
    graphql_errors: ['rate<0.05'],
    light_query_duration: ['p(99)<200'],
    medium_query_duration: ['p(99)<500'],
    heavy_query_duration: ['p(99)<1500'],
    extreme_query_duration: ['p(99)<5000'],
  },
};

// ─── The Benchmark ─────────────────────────────────────
// Each virtual user picks a random query based on weights.
export default function () {
  const q = WEIGHTED[Math.floor(Math.random() * WEIGHTED.length)];

  const res = http.post(`${SERVER}/graphql`, JSON.stringify({ query: q.query }), {
    headers: { 'Content-Type': 'application/json' },
    tags: { query_type: q.name },
  });

  let body;
  try {
    body = res.json();
  } catch {
    body = null;
  }

  const hasData = body && body.data !== undefined;
  const hasErrors = body && body.errors && body.errors.length > 0;

  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': () => hasData,
    'no errors': () => !hasErrors,
  });

  gqlErrors.add(hasErrors ? 1 : 0);
  queryCount.add(1, { type: q.name });

  // Track latency per query type
  const duration = res.timings.duration;
  switch (q.type) {
    case 'light':
      lightRate.add(duration);
      break;
    case 'medium':
      mediumRate.add(duration);
      break;
    case 'heavy':
      heavyRate.add(duration);
      break;
    case 'extreme':
      extremeRate.add(duration);
      break;
    case 'mutation':
      mutationRate.add(duration);
      break;
  }
}

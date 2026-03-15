// This is the k6 benchmark script. The runner calls it like:
//
//   k6 run k6/bench.js \
//     --env SERVER=http://localhost:3001 \
//     --env QUERY='{ health { status } }' \
//     --env PROFILE=standard \
//     --summary-export results/tmp/output.json
//
// k6 handles:
//   - Ramping up virtual users gradually (not instant spike)
//   - Holding sustained load for the configured duration
//   - Validating every GraphQL response
//   - Tracking latency percentiles (p50, p90, p95, p99)
//   - Counting errors and timeouts
//   - Pass/fail thresholds (p99 < 500ms, error rate < 1%)
//   - Exporting detailed JSON summary

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────
// These appear alongside k6's built-in metrics in the output.\
const gqlErrors = new Rate('graphql_errors');
const gqlValid = new Rate('graphql_valid');
const responseSize = new Trend('response_size');

// ─── Load Profiles ─────────────────────────────────────
// Each profile answers a different question.

const PROFILES = {
  // Quick sanity check — 18 seconds total
  quick: {
    stages: [
      { duration: '3s', target: 10 },
      { duration: '10s', target: 10 },
      { duration: '5s', target: 0 },
    ],
  },

  // Standard benchmark — 45 seconds, good for publishing
  standard: {
    stages: [
      { duration: '10s', target: 50 }, // gradual ramp up
      { duration: '30s', target: 50 }, // sustained load
      { duration: '5s', target: 0 }, // ramp down
    ],
  },

  // Stress test — find the breaking point
  stress: {
    stages: [
      { duration: '10s', target: 50 },
      { duration: '20s', target: 50 },
      { duration: '10s', target: 100 },
      { duration: '20s', target: 100 },
      { duration: '10s', target: 200 },
      { duration: '20s', target: 200 },
      { duration: '10s', target: 0 },
    ],
  },

  // Spike test — sudden traffic burst
  spike: {
    stages: [
      { duration: '10s', target: 10 },
      { duration: '15s', target: 10 },
      { duration: '5s', target: 200 }, // SPIKE
      { duration: '20s', target: 200 },
      { duration: '5s', target: 10 }, // drop back
      { duration: '15s', target: 10 },
      { duration: '5s', target: 0 },
    ],
  },
};

// ─── Config from Environment ───────────────────────────

const SERVER = __ENV.SERVER || 'http://127.0.0.1:3001';
const QUERY = __ENV.QUERY || '{ health { status } }';
const PROFILE = __ENV.PROFILE || 'standard';

const profile = PROFILES[PROFILE] || PROFILES.standard;

export const options = {
  scenarios: {
    benchmark: {
      executor: 'ramping-vus',
      startVUs: 0,
      gracefulRampDown: '5s',
      stages: profile.stages,
      tags: { query: QUERY.slice(0, 50) },
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
    graphql_errors: ['rate<0.01'],
    graphql_valid: ['rate>0.99'],
  },
};

// ─── The Benchmark ─────────────────────────────────────
// This function runs once per "virtual user" per iteration.
// k6 calls it thousands of times across all VUs.

export default function () {
  const payload = JSON.stringify({ query: QUERY });

  const res = http.post(`${SERVER}/graphql`, payload, {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // Parse response
  let body;
  try {
    body = res.json();
  } catch {
    body = null;
  }

  const hasData = body && body.data !== undefined;
  const hasErrors = body && body.errors && body.errors.length > 0;

  // Validate — k6 tracks pass/fail rates for each check
  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': () => hasData,
    'no errors': () => !hasErrors,
    'under 1s': (r) => r.timings.duration < 1000,
  });

  // Record custom metrics
  gqlErrors.add(hasErrors ? 1 : 0);
  gqlValid.add(hasData && !hasErrors ? 1 : 0);
  if (res.body) {
    responseSize.add(res.body.length);
  }
}

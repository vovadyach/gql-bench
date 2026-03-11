// DEGRADATION CURVE — Find where each framework starts choking.
//
// Steps through increasing virtual user counts:
//   10 → 25 → 50 → 100 → 200 → 500
//
// At each level, holds for 15 seconds and measures.
// Produces data for the "at what point does it break?" chart
// that nobody else publishes.

import http from 'k6/http';
import { check } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const SERVER = __ENV.SERVER || 'http://localhost:3001';
const QUERY = __ENV.QUERY || '{ health { status adapter uptimeSeconds timestamp } }';

const gqlErrors = new Rate('graphql_errors');

// Step through increasing load levels
export const options = {
  scenarios: {
    degradation: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        // Each step: ramp over 5s, hold 15s
        { duration: '5s', target: 10 },
        { duration: '15s', target: 10 }, // level 1: 10 users
        { duration: '5s', target: 25 },
        { duration: '15s', target: 25 }, // level 2: 25 users
        { duration: '5s', target: 50 },
        { duration: '15s', target: 50 }, // level 3: 50 users
        { duration: '5s', target: 100 },
        { duration: '15s', target: 100 }, // level 4: 100 users
        { duration: '5s', target: 200 },
        { duration: '15s', target: 200 }, // level 5: 200 users
        { duration: '5s', target: 500 },
        { duration: '15s', target: 500 }, // level 6: 500 users
        { duration: '10s', target: 0 }, // ramp down
      ],
    },
  },
  thresholds: {
    // Relaxed — we WANT to find the breaking point
    http_req_duration: ['p(99)<10000'],
    http_req_failed: ['rate<0.20'], // allow up to 20% failures
  },
};

export default function () {
  const rest = http.post(`${SERVER}/graphql`, JSON.stringify({ query: QUERY }), {
    headers: { 'Content-Type': 'application/json' },
  });

  let body;
  try {
    body = res.json();
  } catch {
    body = null;
  }

  check(res, {
    'status 200': (r) => r.status === 200,
    'has data': () => body && body.data !== undefined,
  });

  gqlErrors.add(body?.errors?.length > 0 ? 1 : 0);
}

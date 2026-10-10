# GraphQL Bench Suite
![k6](https://img.shields.io/badge/k6-v1.6-7d64ff?logo=k6)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs)
![GraphQL](https://img.shields.io/badge/GraphQL-16-e535ab?logo=graphql)
![License](https://img.shields.io/badge/License-MIT-green)

Same GraphQL schema and queries across server stacks.

Every configuration benchmarks GraphQL requests. Express and Fastify host the GraphQL
endpoint; Apollo Server, Yoga, and Mercurius handle GraphQL. The dashboard compares
**NestJS** integrations with **Direct** setups (without NestJS), including **Yoga Standalone**,
which runs directly on Node.js HTTP without Express, Fastify, or Apollo Server.

## Currently Testing

```
✅ NestJS — Express + Apollo
✅ NestJS — Fastify + Apollo
✅ NestJS — Fastify + Mercurius
✅ NestJS — Fastify + Yoga

✅ Raw Node.js — Express + Apollo
✅ Raw Node.js — Fastify + Apollo
✅ Raw Node.js — Fastify + Mercurius
✅ Raw Node.js — Fastify + Yoga
✅ Raw Node.js — Express + Yoga
✅ Raw Node.js — Yoga standalone (node:http, no HTTP framework)
```

Raw servers pin the exact library versions NestJS 10 resolves (Express 4.22, Fastify 4.28,
Apollo Server 4.13, Mercurius 14.1, Yoga 5.10), so NestJS vs raw measures NestJS itself —
not library upgrades. On newer majors (Fastify 5, Apollo Server 5, Mercurius 16) the same raw
Fastify servers ran 10–17% slower than NestJS on `health` in an A/B test, which would otherwise
show up as "raw is slower than NestJS".

## Coming Soon

```
🔜 Python — FastAPI + Strawberry
🔜 Go — chi + gqlgen
🔜 C# — ASP.NET + Hot Chocolate
🔜 Java — Spring Boot + Netflix DGS
```

## Prerequisites

```bash
# Install k6 (benchmark tool by Grafana Labs)
brew install k6          # Mac
# sudo snap install k6   # Linux
# choco install k6       # Windows
```

## Run It

```bash
# Step 1: Install dependencies (NestJS + raw Node.js servers)
npm run setup

# Step 2: Quick test (~16 minutes)
npm run bench:quick

# Step 3: Full benchmark (~70 minutes)
npm run bench
```

Results in `results/latest.json`.

## What It Tests

| Scenario | Complexity | What it measures |
|---|---|---|
| `health` | Light | Pure framework + GraphQL engine overhead |
| `single-user` | Medium | Detail page (1 user + posts + comments) |
| `user-list` | Heavy | List page (10 users, nested) |
| `deep-nested` | Extreme | 5×10×8 nested objects + CPU work |
| `mutation` | Medium | Write operation with body parsing |

### Full Mode Extras (npm run bench)

| Test | What it reveals |
|---|---|
| Pre-flight | Cold start times + response size verification |
| Mixed traffic | Production-like query distribution (60/25/15 split) |
| Degradation | Ramp 10→500 users, find the breaking point |

## Key Comparisons

```
Express+Apollo → Fastify+Apollo:      "Does the HTTP adapter matter?"
Fastify+Apollo → Fastify+Mercurius:   "Does the GraphQL engine matter?"
Fastify+Mercurius → Fastify+Yoga:     "Which GraphQL engine is fastest on Fastify?"
Express+Apollo → Fastify+Mercurius:   "What's the total gain switching both?"
NestJS X → Raw X:                     "What does NestJS itself cost?"
Yoga standalone → Raw X+Yoga:         "What does the HTTP framework cost?"
```

## Benchmark Tool: k6 by Grafana Labs

Not autocannon. Not wrk. k6 because:
- Gradual ramp-up (realistic traffic, not instant spike)
- Validates GraphQL responses (not just HTTP 200)
- Pass/fail thresholds (p99 < 500ms, errors < 1%)
- Custom metrics (GraphQL error rate, response sizes)

## How It Works

1. Pre-flight: measures cold start times, verifies response sizes match
2. For each server (one at a time, full CPU), in NestJS/Direct pairs
   (NestJS X, then Direct X) so both sides of a pair see the same machine conditions:
    - Start server
    - Warmup (3000 requests, thrown away)
    - k6 ramps 0→50 users gradually, holds 30s, ramps down
    - k6 validates every GraphQL response
    - Kill server, cool down 5s
3. Mixed traffic: random mix of all query types (production-like)
4. Degradation: ramp to 500 users, find where each server breaks
5. Save everything to JSON

For published numbers, run the full benchmark several times and combine the runs
(median is robust to one noisy run):

```bash
node bench/merge-runs.js --median out.json run1.json run2.json run3.json
```

## Project Structure

```
gql-bench/
├── schema/
│   └── benchmark.graphql                   ← THE contract
│
├── servers/
│   ├── nestjs/                             ← NestJS 10 servers
│   │   ├── src/
│   │   │   ├── shared.ts                   ← types, data, resolver (shared by all 4)
│   │   │   ├── app.module.ts               ← Apollo config
│   │   │   ├── app.module-mercurius.ts     ← Mercurius config
│   │   │   ├── app.module-yoga.ts          ← Yoga config
│   │   │   ├── main-express.ts             ← Express + Apollo
│   │   │   ├── main-fastify.ts             ← Fastify + Apollo
│   │   │   ├── main-mercurius.ts           ← Fastify + Mercurius
│   │   │   └── main-yoga.ts                ← Fastify + Yoga
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── node/                               ← Raw Node.js servers (no NestJS)
│   │   ├── src/
│   │   │   ├── schema.ts                   ← loads schema/benchmark.graphql
│   │   │   ├── resolvers.ts                ← resolvers (shared by all 6)
│   │   │   ├── data.ts                     ← same fake data as the NestJS DataService
│   │   │   ├── express-apollo.ts           ← Express + Apollo
│   │   │   ├── express-yoga.ts             ← Express + Yoga
│   │   │   ├── fastify-apollo.ts           ← Fastify + Apollo
│   │   │   ├── fastify-mercurius.ts        ← Fastify + Mercurius
│   │   │   ├── fastify-yoga.ts             ← Fastify + Yoga
│   │   │   └── yoga-standalone.ts          ← Yoga on plain node:http
│   │   ├── package.json                    ← versions pinned to match NestJS 10
│   │   └── tsconfig.json
│   │
│   ├── go/                                  ← add later 🔜
│   ├── dotnet/                              ← add later 🔜
│   ├── java/                                ← add later 🔜
│   └── python/                              ← add later 🔜
│
├── k6/                                      ← Benchmark scripts (language-agnostic)
│   ├── bench.js                             ← per-scenario benchmark
│   ├── mixed-traffic.js                     ← production-like query mix
│   └── degradation.js                       ← find the breaking point
│
├── bench/                                   ← Runner (language-agnostic)
│   ├── run.js                               ← orchestrates everything
│   ├── merge-runs.js                        ← combines several runs (mean or --median)
│   └── preflight.js                         ← cold start + response size checks
│
├── results/                                 ← Output
│   └── latest.json
│
└── package.json                             ← root: just bench commands
```

## Adding a New Language Later

1. Create `servers/your-lang/` with code implementing `schema/benchmark.graphql`
2. Add one entry to the SERVERS array in `bench/run.js`
3. Run `npm run bench`
4. To show it on the dashboard, add it to `SERVERS` in `dashboard/src/lib/constants.ts`
   and give it a `--server-<key>` color in `dashboard/src/app/globals.css`

k6 scripts, runner logic, and results format stay the same.
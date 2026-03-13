# GraphQL Bench Suite
![k6](https://img.shields.io/badge/k6-v1.6-7d64ff?logo=k6)
![NestJS](https://img.shields.io/badge/NestJS-10-e0234e?logo=nestjs)
![GraphQL](https://img.shields.io/badge/GraphQL-16-e535ab?logo=graphql)
![License](https://img.shields.io/badge/License-MIT-green)

Same schema, same queries, fair fight.

## Currently Testing

```
✅ NestJS — Express + Apollo
✅ NestJS — Fastify + Apollo
✅ NestJS — Fastify + Mercurius
```

## Coming Soon

```
🔜 Go — chi + gqlgen
🔜 Go — Fiber + gqlgen
🔜 Go — Gin + gqlgen
🔜 C# — ASP.NET + Hot Chocolate
🔜 Java — Spring Boot + Netflix DGS
🔜 Python — FastAPI + Strawberry   
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
# Step 1: Install Node dependencies
npm run setup

# Step 2: Quick test (3 minutes)
npm run bench:quick

# Step 3: Full benchmark (30 minutes)
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

## Three Findings

```
Express+Apollo → Fastify+Apollo:      "Does the HTTP adapter matter?"
Fastify+Apollo → Fastify+Mercurius:   "Does the GraphQL engine matter?"
Express+Apollo → Fastify+Mercurius:   "What's the total gain switching both?"
```

## Benchmark Tool: k6 by Grafana Labs

Not autocannon. Not wrk. k6 because:
- Gradual ramp-up (realistic traffic, not instant spike)
- Validates GraphQL responses (not just HTTP 200)
- Pass/fail thresholds (p99 < 500ms, errors < 1%)
- Custom metrics (GraphQL error rate, response sizes)

## How It Works

1. Pre-flight: measures cold start times, verifies response sizes match
2. For each server (one at a time, full CPU):
    - Start server
    - Warmup (3000 requests, thrown away)
    - k6 ramps 0→50 users gradually, holds 30s, ramps down
    - k6 validates every GraphQL response
    - Kill server, cool down 5s
3. Mixed traffic: random mix of all query types (production-like)
4. Degradation: ramp to 500 users, find where each server breaks
5. Save everything to JSON

## Project Structure

```
gql-bench/
├── schema/
│   └── benchmark.graphql                   ← THE contract
│
├── servers/
│   ├── node/                               ← Node.js servers
│   │   ├── src/
│   │   │   ├── shared.ts                   ← types, data, resolver (shared by all 3)
│   │   │   ├── app.module.ts               ← Apollo config
│   │   │   ├── app.module-mercurius.ts     ← Mercurius config
│   │   │   ├── main-express.ts             ← Express + Apollo
│   │   │   ├── main-fastify.ts             ← Fastify + Apollo
│   │   │   └── main-mercurius.ts           ← Fastify + Mercurius
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── go/                                  ← add later 🔜
│   ├── dotnet/                              ← add later 🔜
│   └── java/                                ← add later 🔜
│
├── k6/                                      ← Benchmark scripts (language-agnostic)
│   ├── bench.js                             ← per-scenario benchmark
│   ├── mixed-traffic.js                     ← production-like query mix
│   └── degradation.js                       ← find the breaking point
│
├── bench/                                   ← Runner (language-agnostic)
│   ├── run.js                               ← orchestrates everything
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

Nothing else changes. k6 scripts, runner logic, and results format stay the same.
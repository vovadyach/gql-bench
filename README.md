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

✅ Python — FastAPI + Strawberry
✅ C# — ASP.NET Core + Hot Chocolate
✅ Go — chi + gqlgen
✅ Java — Spring Boot + Netflix DGS
```

Raw servers pin the exact library versions NestJS 10 resolves (Express 4.22, Fastify 4.28,
Apollo Server 4.13, Mercurius 14.1, Yoga 5.10), so NestJS vs raw measures NestJS itself —
not library upgrades. On newer majors (Fastify 5, Apollo Server 5, Mercurius 16) the same raw
Fastify servers ran 10–17% slower than NestJS on `health` in an A/B test, which would otherwise
show up as "raw is slower than NestJS".

Python, C#, Go and Java run the same schema, data, simulated delays and CPU work. Every server,
in every language, is one process on one thread, so the numbers compare speed per core: by default
.NET, Go and Java would use all cores, and Node.js would need one process per core to do the same. The dashboard
compares each language with the fastest Node.js server.

## Prerequisites

```bash
# Install k6 (benchmark tool by Grafana Labs)
brew install k6          # Mac
# sudo snap install k6   # Linux
# choco install k6       # Windows

# Python server: uv (it installs Python 3.14 for you)
brew install uv          # Mac (Apple Silicon)
# curl -LsSf https://astral.sh/uv/install.sh | sh   # Intel Mac / Linux

# C# server: the .NET 10 SDK
# https://dotnet.microsoft.com/download/dotnet/10.0

# Go server: Go 1.27
brew install go          # Mac
# https://go.dev/dl/

# Java server: Java 25 (Maven comes with the project)
brew install --cask temurin@25   # Mac
# https://adoptium.net/temurin/releases/?version=25
```

## Run It

```bash
# Step 1: Install dependencies (Node.js, Python, C#, Go and Java servers)
npm run setup

# Step 2: Quick test (~23 minutes)
npm run bench:quick

# Step 3: Full benchmark (~100 minutes)
npm run bench
```

Node.js only (no uv, .NET, Go or Java needed): install with `npm run setup:node`, then add `-- --only=node`
to the bench commands, e.g. `npm run bench -- --only=node`.

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
| Mixed traffic | Production-like query mix: 30% health, 25% single-user, 20% mutation, 15% user-list, 10% deep-nested |
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
│   ├── python/                             ← FastAPI + Strawberry
│   │   ├── main.py                         ← app + uvicorn, one worker
│   │   ├── schema.py                       ← schema + resolvers (same delays and CPU work)
│   │   ├── data.py                         ← same fake data as the Node.js servers
│   │   ├── pyproject.toml
│   │   └── uv.lock                         ← exact versions
│   │
│   ├── csharp/                             ← ASP.NET Core + Hot Chocolate
│   │   ├── Program.cs                      ← server setup
│   │   ├── Schema.cs                       ← resolvers (same delays and CPU work)
│   │   ├── Data.cs                         ← same fake data, also the GraphQL types
│   │   ├── GqlBench.csproj                 ← one thread pool thread, workstation GC
│   │   ├── global.json                     ← .NET 10 SDK
│   │   └── packages.lock.json              ← exact versions
│   │
│   ├── go/                                 ← chi + gqlgen
│   │   ├── main.go                         ← server setup, GOMAXPROCS=1
│   │   ├── graph/resolver.go               ← resolvers (same delays and CPU work)
│   │   ├── graph/model/models.go           ← same fake data, also the GraphQL types
│   │   ├── graph/generated.go              ← generated by gqlgen from the schema
│   │   ├── gqlgen.yml
│   │   └── go.mod / go.sum                 ← exact versions
│   │
│   └── java/                               ← Spring Boot + Netflix DGS
│       ├── src/main/java/gqlbench/
│       │   ├── Application.java            ← server setup
│       │   ├── Resolvers.java              ← resolvers (same delays and CPU work)
│       │   └── Data.java                   ← same fake data, also the GraphQL types
│       ├── src/main/resources/application.properties ← virtual threads, port
│       ├── pom.xml                         ← exact versions (Spring Boot 4.1, DGS 12.1)
│       └── mvnw                            ← Maven wrapper (no Maven install needed)
│
├── k6/                                      ← Benchmark scripts (language-agnostic)
│   ├── bench.js                             ← per-scenario benchmark
│   ├── mixed-traffic.js                     ← production-like query mix
│   └── degradation.js                       ← find the breaking point
│
├── bench/                                   ← Runner (language-agnostic)
│   ├── run.js                               ← orchestrates everything
│   ├── merge-runs.js                        ← combines several runs (mean or --median)
│   ├── add-runs.js                          ← adds a language measured separately
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
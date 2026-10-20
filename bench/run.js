#!/usr/bin/env node

// HOW THIS WORKS:
//
// 1. Build TypeScript (Node servers), sync the Python environment (uv), build the C# server (dotnet)
// 2. For each server (one at a time, never parallel):
//    a. Start the server
//    b. Warm it up (throwaway requests)
//    c. For each scenario:
//       - Run k6 with the GraphQL query
//       - k6 ramps up users gradually, holds load, ramps down
//       - k6 validates every response (not just HTTP 200)
//       - k6 exports detailed metrics JSON
//       - Record how many CPU cores the server used meanwhile
//    d. Kill the server
//    e. Wait (let CPU cool)
// 3. Save all results to results/latest.json
//
// REQUIRES: k6 installed (brew install k6 / snap install k6), uv for the Python server,
// the .NET 10 SDK for the C# server
//
// --only=python,mercurius runs just the servers whose name or language matches
// (for quick checks; partial results aren't meant for the dashboard)

const { execSync, spawn, spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ─── Check k6 is installed ────────────────────────────
try {
  execSync('k6 version', { stdio: 'pipe' });
} catch {
  console.error('\n  ❌ k6 is not installed.\n');
  console.error('  Install it:');
  console.error('    Mac:     brew install k6');
  console.error('    Linux:   sudo snap install k6');
  console.error('    Windows: choco install k6');
  console.error('    Or:      https://github.com/grafana/k6/releases\n');
  process.exit(1);
}

// ─── Config ────────────────────────────────────────────

const IS_QUICK = process.argv.includes('--quick');
const PROFILE = IS_QUICK ? 'quick' : 'standard';
const WARMUP_COUNT = IS_QUICK ? 500 : 3000;
const COOLDOWN = IS_QUICK ? 2000 : 5000; // ms between servers
const MINUTES_PER_SERVER = IS_QUICK ? 1.6 : 7.1; // measured on full 10-server runs
const ONLY = process.argv
  .find((arg) => arg.startsWith('--only='))
  ?.slice('--only='.length)
  .toLowerCase()
  .split(',')
  .filter(Boolean);

// ─── Scenarios ─────────────────────────────────────────
// Each is a real GraphQL query at different complexity levels.

const SCENARIOS = [
  {
    id: 'health',
    name: 'Health Check (Scalar)',
    complexity: 'light',
    query: '{ health { status adapter uptimeSeconds timestamp } }',
  },
  {
    id: 'single-user',
    name: 'Single User + Posts',
    complexity: 'medium',
    query:
      '{ user(id: 1) { id name email role posts { id title status viewCount comments { id body likes } } stats { totalPosts avgRating totalViews } } }',
  },
  {
    id: 'user-list',
    name: 'Paginated Users (10)',
    complexity: 'heavy',
    query:
      '{ users(page: 1, pageSize: 10) { items { id name role posts { id title rating comments { id body } } stats { totalPosts avgRating } } total hasMore } }',
  },
  {
    id: 'deep-nested',
    name: 'Deep Nested (5×10×8)',
    complexity: 'extreme',
    query:
      '{ deepNested(count: 5) { id name email posts { id title body status tags viewCount rating comments { id body authorName likes } } stats { totalPosts totalComments avgRating totalViews } } }',
  },
  {
    id: 'mutation',
    name: 'Create Post (Mutation)',
    complexity: 'medium',
    query:
      'mutation { createPost(userId: 1, input: { title: "Bench Post", body: "Testing mutation performance", tags: ["bench", "test"] }) { id title status createdAt } }',
  },
];

// ─── Servers ───────────────────────────────────────────
// Node servers name their built `entry` file; other languages give the full `command`.

const PYTHON_DIR = path.resolve(__dirname, '../servers/python');
const PYTHON_BIN = path.join(PYTHON_DIR, '.venv/bin/python');
const CSHARP_DIR = path.resolve(__dirname, '../servers/csharp');

// Each NestJS server runs right before its direct twin, so every NestJS-vs-direct
// comparison is measured minutes apart under the same machine conditions
const ALL_SERVERS = [
  {
    name: 'Express',
    port: 3001,
    entry: '../servers/nestjs/dist/main-express.js',
    env: { ADAPTER: 'express' },
  },
  {
    name: 'Raw-Express-Apollo',
    port: 3005,
    entry: '../servers/node/dist/express-apollo.js',
    env: { ADAPTER: 'raw-express-apollo' },
  },
  {
    name: 'Fastify',
    port: 3002,
    entry: '../servers/nestjs/dist/main-fastify.js',
    env: { ADAPTER: 'fastify' },
  },
  {
    name: 'Raw-Fastify-Apollo',
    port: 3007,
    entry: '../servers/node/dist/fastify-apollo.js',
    env: { ADAPTER: 'raw-fastify-apollo' },
  },
  {
    name: 'Mercurius',
    port: 3003,
    entry: '../servers/nestjs/dist/main-mercurius.js',
    env: { ADAPTER: 'mercurius' },
  },
  {
    name: 'Raw-Fastify-Mercurius',
    port: 3008,
    entry: '../servers/node/dist/fastify-mercurius.js',
    env: { ADAPTER: 'raw-fastify-mercurius' },
  },
  {
    name: 'Yoga',
    port: 3004,
    entry: '../servers/nestjs/dist/main-yoga.js',
    env: { ADAPTER: 'yoga' },
  },
  {
    name: 'Raw-Fastify-Yoga',
    port: 3009,
    entry: '../servers/node/dist/fastify-yoga.js',
    env: { ADAPTER: 'raw-fastify-yoga' },
  },
  // Direct-only (no NestJS version)
  {
    name: 'Raw-Express-Yoga',
    port: 3006,
    entry: '../servers/node/dist/express-yoga.js',
    env: { ADAPTER: 'raw-express-yoga' },
  },
  {
    name: 'Yoga-Standalone',
    port: 3010,
    entry: '../servers/node/dist/yoga-standalone.js',
    env: { ADAPTER: 'yoga-standalone' },
  },

  // Other languages: one process each, like the single-threaded Node servers
  {
    name: 'Python-FastAPI-Strawberry',
    lang: 'python',
    port: 3011,
    command: [PYTHON_BIN, path.join(PYTHON_DIR, 'main.py')],
    env: { ADAPTER: 'python-fastapi-strawberry' },
  },
  // C# runs on one thread pool thread with workstation GC, set in GqlBench.csproj, so no extra env
  {
    name: 'CSharp-AspNetCore-HotChocolate',
    lang: 'csharp',
    port: 3012,
    command: ['dotnet', path.join(CSHARP_DIR, 'bin/Release/net10.0/GqlBench.dll')],
    env: { ADAPTER: 'csharp-aspnetcore-hotchocolate' },
  },

  // Future: add Go and Java here, e.g.
  // { name: 'Go-Chi-Gqlgen', lang: 'go', port: 3013, command: [GO_BIN], env: { ADAPTER: 'go-chi-gqlgen' } },
];

const langOf = (server) => server.lang || 'node';
const SERVERS = ONLY
  ? ALL_SERVERS.filter((s) => ONLY.some((f) => s.name.toLowerCase().includes(f) || langOf(s) === f))
  : ALL_SERVERS;
if (!SERVERS.length) {
  console.error(`\n  ❌ --only=${ONLY.join(',')} matched no server. Servers:`);
  for (const s of ALL_SERVERS) console.error(`     ${s.name} (${langOf(s)})`);
  process.exit(1);
}
const RUNS_NODE = SERVERS.some((s) => langOf(s) === 'node');
const RUNS_PYTHON = SERVERS.some((s) => langOf(s) === 'python');
const RUNS_CSHARP = SERVERS.some((s) => langOf(s) === 'csharp');

const estMinutes = Math.round(SERVERS.length * MINUTES_PER_SERVER);
console.log(
  `\n  Mode: ${IS_QUICK ? 'QUICK' : 'STANDARD'} (~${estMinutes} min, ${SERVERS.length} servers)`,
);
if (ONLY) {
  console.log(
    `  Only: ${SERVERS.map((s) => s.name).join(', ')} (partial run, not for the dashboard)`,
  );
}
console.log(`  Profile: ${PROFILE}`);
console.log(`  Tool: k6 (${execSync('k6 version', { encoding: 'utf-8' }).trim()})\n`);

// ─── Helpers ───────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function serverCommand(server) {
  return server.command || ['node', path.resolve(__dirname, server.entry)];
}

function startServer(server) {
  const [cmd, ...args] = serverCommand(server);
  const child = spawn(cmd, args, {
    env: { ...process.env, PORT: String(server.port), ...server.env },
    stdio: 'pipe',
  });
  child.stderr.on('data', (d) => {
    const msg = d.toString();
    if (!msg.includes('ExperimentalWarning')) process.stderr.write(d);
  });

  return child;
}

async function waitForServer(port, retries = 30) {
  const body = JSON.stringify({ query: '{ health { status } }' });
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/graphql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.data?.health) return true;
      }
    } catch {}
    await sleep(500);
  }
  throw new Error(`Server on port ${port} not ready`);
}

async function warmup(port, count) {
  const body = JSON.stringify({ query: '{ health { status } }' });
  const batch = 50;
  for (let i = 0; i < Math.ceil(count / batch); i++) {
    await Promise.all(
      Array.from({ length: batch }, () =>
        fetch(`http://127.0.0.1:${port}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      ),
    );
  }
}

// ─── CPU Use ───────────────────────────────────────────
// Every server is meant to use one CPU core, like single-threaded Node. These record how many it did.

// CPU time a process has used so far, in seconds; null once the process is gone.
// ps prints [[DD-]HH:]MM:SS[.hh]: hundredths of a second on macOS, whole seconds on Linux
function cpuSeconds(pid) {
  try {
    const time = execSync(`ps -o time= -p ${pid}`, { encoding: 'utf-8' }).trim();
    const [days, clock] = time.includes('-') ? time.split('-') : ['0', time];
    return (
      clock.split(':').reduce((sum, part) => sum * 60 + Number(part), 0) + Number(days) * 86400
    );
  } catch {
    return null;
  }
}

// Runs `run` (a k6 run) and adds `cores`: the server's CPU time divided by the wall-clock time,
// so 1.0 means one core busy for the whole run, ramp-up and ramp-down included
async function withCpuCores(pid, run) {
  const cpuStart = cpuSeconds(pid);
  const wallStart = performance.now();
  const result = await run();
  const cpuEnd = cpuSeconds(pid);
  const wallSeconds = (performance.now() - wallStart) / 1000;
  const cores =
    cpuStart === null || cpuEnd === null ? null : +((cpuEnd - cpuStart) / wallSeconds).toFixed(2);
  return { ...result, cores };
}

const coresText = (cores) => (cores == null ? 'CPU unknown' : `${cores.toFixed(2)} cores`);

// The .NET runtime the C# server runs on: GqlBench.dll asks for 10.0, and .NET picks the
// newest installed 10.0.x
function dotnetVersion() {
  const patches = execSync('dotnet --list-runtimes', { encoding: 'utf-8' })
    .split('\n')
    .map((line) => line.match(/^Microsoft\.NETCore\.App 10\.0\.(\d+) /)?.[1])
    .filter(Boolean)
    .map(Number);
  return patches.length ? `10.0.${Math.max(...patches)}` : 'unknown';
}

// ─── Run k6 ────────────────────────────────────────────
function runK6(serverUrl, query, profile, outputFile) {
  return new Promise((resolve, reject) => {
    const k6Script = path.resolve(__dirname, '../k6/bench.js');

    const proc = spawn(
      'k6',
      [
        'run',
        '--summary-export',
        outputFile,
        '--summary-trend-stats',
        'avg,min,med,max,p(90),p(95),p(99)',
        '--env',
        `SERVER=${serverUrl}`,
        '--env',
        `QUERY=${query}`,
        '--env',
        `PROFILE=${profile}`,
        '--quiet',
        '--no-color',
        k6Script,
      ],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    );

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', (d) => {
      stdout += d;
      // Show k6 progress line
      const line = d.toString().trim();
      if (line) process.stdout.write(`     ${line}\n`);
    });
    proc.stderr.on('data', (d) => (stderr += d));

    proc.on('close', (code) => {
      // code 99 = thresholds failed (still valid data)
      if (fs.existsSync(outputFile)) {
        try {
          const summary = JSON.parse(fs.readFileSync(outputFile, 'utf-8'));
          resolve({ summary, code });
        } catch (err) {
          reject(new Error(`Failed to parse k6 output: ${err.message}`));
        }
      } else {
        reject(new Error(`k6 produced no output (exit ${code}): ${stderr.slice(0, 300)}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`k6 failed to start: ${err.message}`));
    });
  });
}

// Run a custom k6 script (for mixed-traffic and degradation)
function runK6Custom(scriptPath, port, profile, outputFile) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'k6',
      [
        'run',
        '--summary-export',
        outputFile,
        '--summary-trend-stats',
        'avg,min,med,max,p(90),p(95),p(99)',
        '--env',
        `SERVER=http://127.0.0.1:${port}`,
        '--env',
        `PROFILE=${profile}`,
        '--quiet',
        '--no-color',
        scriptPath,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stderr = '';
    proc.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) process.stdout.write(`        ${line}\n`);
    });
    proc.stderr.on('data', (d) => (stderr += d));

    proc.on('close', (code) => {
      if (fs.existsSync(outputFile)) {
        try {
          resolve({ summary: JSON.parse(fs.readFileSync(outputFile, 'utf-8')), code });
        } catch (err) {
          reject(new Error(`Parse error: ${err.message}`));
        }
      }
    });
    proc.on('error', reject);
  });
}

// Run a custom k6 script with a specific query (for degradation)
function runK6CustomWithQuery(scriptPath, port, query, outputFile) {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      'k6',
      [
        'run',
        '--summary-export',
        outputFile,
        '--summary-trend-stats',
        'avg,min,med,max,p(90),p(95),p(99)',
        '--env',
        `SERVER=http://127.0.0.1:${port}`,
        '--env',
        `QUERY=${query}`,
        '--quiet',
        '--no-color',
        scriptPath,
      ],
      { stdio: ['pipe', 'pipe', 'pipe'] },
    );

    let stderr = '';
    proc.stdout.on('data', (d) => {
      const line = d.toString().trim();
      if (line) process.stdout.write(`        ${line}\n`);
    });
    proc.stderr.on('data', (d) => (stderr += d));

    proc.on('close', (code) => {
      if (fs.existsSync(outputFile)) {
        try {
          resolve({ summary: JSON.parse(fs.readFileSync(outputFile, 'utf-8')), code });
        } catch (err) {
          reject(new Error(`Parse error: ${err.message}`));
        }
      } else {
        reject(new Error(`No output (exit ${code}): ${stderr.slice(0, 300)}`));
      }
    });
    proc.on('error', reject);
  });
}

// ─── Extract Metrics from k6 Summary ───────────────────
function extractMetrics(summary, k6ExitCode, cpuCores) {
  const m = summary.metrics || {};

  const dur = m.http_req_duration || {};
  const reqs = m.http_reqs || {};
  const failed = m.http_req_failed || {};
  const recv = m.data_received || {};
  const sent = m.data_sent || {};
  const iters = m.iterations || {};
  const gqlErr = m.graphql_errors || {};
  const gqlOk = m.graphql_valid || {};
  const size = m.response_size || {};

  // Threshold results
  const thresholds = {};
  for (const [key, val] of Object.entries(summary.thresholds || {})) {
    thresholds[key] = val.ok;
  }

  return {
    requests: {
      total: reqs.count || 0,
      rate: +(reqs.rate || 0).toFixed(2), // requests per second
    },
    iterations: {
      total: iters.count || 0,
      rate: +(iters.rate || 0).toFixed(2),
    },
    latency_ms: {
      avg: +(dur.avg || 0).toFixed(2),
      min: +(dur.min || 0).toFixed(2),
      max: +(dur.max || 0).toFixed(2),
      med: +(dur.med || 0).toFixed(2), // median (p50)
      p90: +(dur['p(90)'] || 0).toFixed(2),
      p95: +(dur['p(95)'] || 0).toFixed(2),
      p99: +(dur['p(99)'] || 0).toFixed(2),
    },
    throughput: {
      received_mb: +((recv.count || 0) / 1024 / 1024).toFixed(2),
      sent_mb: +((sent.count || 0) / 1024 / 1024).toFixed(2),
    },
    errors: {
      http_failure_rate: +(failed.value ?? 0).toFixed(4),
      graphql_error_rate: +(gqlErr.value ?? 0).toFixed(4),
      valid_response_rate: +(gqlOk.value ?? 0).toFixed(4),
    },
    response_size_bytes: {
      avg: +(size.avg || 0).toFixed(0),
    },
    cpu_cores: cpuCores, // average CPU cores the server used during the run (see withCpuCores)
    thresholds, // pass/fail per threshold
    thresholds_passed: k6ExitCode === 0, // all thresholds passed?
  };
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  console.log('  ╔════════════════════════════════════════════════════════════════════════╗');
  console.log('  ║  GraphQL Benchmark Suite (k6)                                          ║');
  console.log('  ║  Same schema, same queries, fair fight.                                ║');
  console.log('  ╚════════════════════════════════════════════════════════════════════════╝\n');

  // Cleanup leftover servers from previous runs
  for (const server of ALL_SERVERS) {
    try {
      execSync(`kill -9 $(lsof -ti:${server.port}) 2>/dev/null`, { stdio: 'ignore' });
    } catch {}
  }

  // Step 1: Build TypeScript (Node servers)
  if (RUNS_NODE) {
    console.log('  📦 Building NestJS servers...');
    try {
      execSync('npx nest build', {
        cwd: path.resolve(__dirname, '../servers/nestjs'),
        stdio: 'inherit',
      });
    } catch {
      console.error('  ❌ NestJS Build failed. Run "cd servers/nestjs && npm install" first.');
      process.exit(1);
    }
    console.log('  ✅ NestJS Build complete\n');

    console.log('  📦 Building raw Node.js servers...');
    try {
      execSync('npx tsc', {
        cwd: path.resolve(__dirname, '../servers/node'),
        stdio: 'inherit',
      });
    } catch {
      console.error('  ❌ Raw build failed. Run "cd servers/node && npm install" first.');
      process.exit(1);
    }
    console.log('  ✅ Raw build complete\n');
  }

  // Install exactly the versions in uv.lock, with bytecode precompiled so the
  // cold start measures server startup, not first-run compilation
  if (RUNS_PYTHON) {
    console.log('  📦 Syncing Python server (uv)...');
    try {
      execSync('uv sync --locked --compile-bytecode', { cwd: PYTHON_DIR, stdio: 'inherit' });
    } catch {
      console.error('  ❌ Python setup failed. Install uv, then run "npm run setup":');
      console.error('     Mac (Apple Silicon): brew install uv');
      console.error('     Intel Mac / Linux:   curl -LsSf https://astral.sh/uv/install.sh | sh');
      process.exit(1);
    }
    console.log('  ✅ Python ready\n');
  }

  // Release build with exactly the package versions in packages.lock.json. No build
  // servers, so no compiler processes stay in the background while servers are measured
  if (RUNS_CSHARP) {
    console.log('  📦 Building C# server (dotnet)...');
    try {
      execSync(
        'dotnet build -c Release -p:RestoreLockedMode=true --disable-build-servers -nologo',
        {
          cwd: CSHARP_DIR,
          stdio: 'inherit',
        },
      );
    } catch {
      console.error('  ❌ C# build failed. Install the .NET 10 SDK, then run "npm run setup":');
      console.error('     https://dotnet.microsoft.com/download/dotnet/10.0');
      process.exit(1);
    }
    console.log('  ✅ C# build complete\n');
  }

  // ─── Pre-flight: Cold Start & Response Size Verification ──
  const { measureColdStart, measureResponseSizes } = require('./preflight');
  const IS_FULL = !IS_QUICK;
  const preflight = { cold_starts: {}, response_sizes: {} };

  if (IS_FULL) {
    console.log('  ─── PREFLIGHT CHECKS ───────────────────────────────\n');

    // Cold start times
    console.log('  🕐 Measuring cold start times...');
    for (const server of SERVERS) {
      const ms = await measureColdStart(serverCommand(server), server.port, server.env);
      preflight.cold_starts[server.name.toLowerCase()] = ms;
      console.log(`    ${server.name}: ${ms}ms to first response`);
    }
    console.log('');

    // Response size verification (start Express to measure, it's representative)
    console.log('  📏 Verifying response sizes match across servers...');
    for (const server of SERVERS) {
      const proc = startServer(server);
      try {
        await waitForServer(server.port);
        const sizes = await measureResponseSizes(server.port);
        preflight.response_sizes[server.name.toLowerCase()] = sizes;

        for (const [qid, info] of Object.entries(sizes)) {
          const ok = info.valid ? '✅' : '❌';
          console.log(`    ${server.name} → ${qid}: ${info.bytes} bytes ${ok}`);
        }
      } catch (err) {
        console.error(`    ${server.name}: ${err.message}`);
      } finally {
        proc.kill('SIGTERM');
        await sleep(2000);
      }
    }

    // Check sizes match
    const serverNames = Object.keys(preflight.response_sizes);
    // health echoes each server's ADAPTER name back, so discount its length
    const adapterLen = (name) =>
      SERVERS.find((s) => s.name.toLowerCase() === name)?.env.ADAPTER?.length || 0;
    if (serverNames.length >= 2) {
      const first = preflight.response_sizes[serverNames[0]];
      let allMatch = true;
      for (let i = 1; i < serverNames.length; i++) {
        const other = preflight.response_sizes[serverNames[i]];
        for (const qid of Object.keys(first)) {
          const nameDiff =
            qid === 'health' ? adapterLen(serverNames[i]) - adapterLen(serverNames[0]) : 0;
          const diff = Math.abs((other[qid]?.bytes || 0) - (first[qid]?.bytes || 0) - nameDiff);
          if (diff > 10) {
            // allow tiny float rounding differences
            console.log(
              `    ⚠️  Size mismatch: ${qid} differs by ${diff} bytes between ${serverNames[0]} and ${serverNames[i]}`,
            );
            allMatch = false;
          }
        }
      }
      if (allMatch) console.log('\n  ✅ All response sizes match — benchmark is fair\n');
    }
  }

  // Prepare tmp dir for k6 output files
  const tmpDir = path.resolve(__dirname, '../results/tmp');
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // Results structure
  const results = {
    meta: {
      date: new Date().toISOString(),
      tool: 'k6',
      profile: PROFILE,
      warmup_requests: WARMUP_COUNT,
      node_version: process.version,
      python_version: RUNS_PYTHON
        ? execSync(`"${PYTHON_BIN}" --version`, { encoding: 'utf-8' }).trim().replace('Python ', '')
        : undefined,
      dotnet_version: RUNS_CSHARP ? dotnetVersion() : undefined,
      only: ONLY,
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      cpu_model: os.cpus()[0]?.model || 'unknown',
      memory_gb: +(os.totalmem() / 1024 / 1024 / 1024).toFixed(1),
      methodology: [
        'Sequential execution — one server at a time, full CPU',
        `Warmup: ${WARMUP_COUNT} throwaway requests before each server`,
        `Profile: ${PROFILE} (k6 ramping-vus with gradual ramp-up)`,
        'Response validation: every GraphQL response checked for errors',
        'Response sizes verified identical across all servers',
        `Cooldown: ${COOLDOWN / 1000}s between servers`,
        ...(RUNS_PYTHON
          ? [
              'Python: single process (one uvicorn worker), same as the single-threaded Node servers',
            ]
          : []),
        ...(RUNS_CSHARP
          ? [
              'C#: single process, all request work on one thread pool thread, workstation GC; same as the single-threaded Node servers',
            ]
          : []),
      ],
    },
    preflight,
    scenarios: [],
    mixed_traffic: null,
    degradation: null,
  };

  // Step 2: Benchmark each server, one at a time
  const totalTests = SERVERS.length * SCENARIOS.length;
  let completed = 0;

  for (const server of SERVERS) {
    console.log(`\n  ${'═'.repeat(58)}`);
    console.log(`  🔧 ${server.name} (port ${server.port})`);
    console.log(`  ${'═'.repeat(58)}`);

    // Start server
    console.log(`\n    Starting ${server.name}...`);
    const proc = startServer(server);

    try {
      await waitForServer(server.port);
      console.log(`    ✅ ${server.name} ready`);

      // Warmup
      console.log(`    ⏳ Warming up (${WARMUP_COUNT} requests)...`);
      await warmup(server.port, WARMUP_COUNT);
      await sleep(1000); // let GC settle

      // Run each scenario against this server
      for (const scenario of SCENARIOS) {
        completed++;
        console.log(
          `    ── ${scenario.name} [${scenario.complexity}] (${completed}/${totalTests}) ──`,
        );
        const outputFile = path.join(tmpDir, `${server.name.toLowerCase()}-${scenario.id}.json`);

        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
        try {
          const { summary, code, cores } = await withCpuCores(proc.pid, () =>
            runK6(`http://127.0.0.1:${server.port}`, scenario.query, PROFILE, outputFile),
          );

          const metrics = extractMetrics(summary, code, cores);

          // Find or create scenario entry
          let scenarioEntry = results.scenarios.find((s) => s.id === scenario.id);
          if (!scenarioEntry) {
            scenarioEntry = {
              id: scenario.id,
              name: scenario.name,
              complexity: scenario.complexity,
              servers: {},
            };
            results.scenarios.push(scenarioEntry);
          }
          scenarioEntry.servers[server.name.toLowerCase()] = metrics;

          const pass = metrics.thresholds_passed ? '✅ PASS' : '⚠️  FAIL';
          console.log(
            `             ${pass} | ${metrics.requests.rate} req/s | avg ${metrics.latency_ms.avg}ms | p99 ${metrics.latency_ms.p99}ms | ${coresText(cores)}\n`,
          );
        } catch (err) {
          console.error(`      ❌ ${err.message}\n`);
          let scenarioEntry = results.scenarios.find((s) => s.id === scenario.id);
          if (!scenarioEntry) {
            scenarioEntry = {
              id: scenario.id,
              name: scenario.name,
              complexity: scenario.complexity,
              servers: {},
            };
            results.scenarios.push(scenarioEntry);
          }
          scenarioEntry.servers[server.name.toLowerCase()] = { error: err.message };
        }
      }
    } catch (err) {
      console.error(`    ❌ ${server.name} failed: ${err.message}`);
    } finally {
      proc.kill('SIGTERM');
      console.log(`    ⏸  Killing ${server.name}, cooling down ${COOLDOWN / 1000}s...`);
      await sleep(COOLDOWN);
    }
  }

  // ─── Step 3: Mixed Traffic (full mode only) ──────────
  if (IS_FULL) {
    console.log(`\n  ${'═'.repeat(58)}`);
    console.log('  🔀 MIXED TRAFFIC — Real production query distribution');
    console.log(`  ${'═'.repeat(58)}\n`);

    results.mixed_traffic = {};
    for (const server of SERVERS) {
      console.log(`    🔧 ${server.name}...`);
      const proc = startServer(server);
      try {
        await waitForServer(server.port);
        await warmup(server.port, WARMUP_COUNT);
        await sleep(1000);

        const outputFile = path.join(tmpDir, `${server.name.toLowerCase()}-mixed.json`);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

        const k6Script = path.resolve(__dirname, '../k6/mixed-traffic.js');
        const { summary, code, cores } = await withCpuCores(proc.pid, () =>
          runK6Custom(k6Script, server.port, PROFILE, outputFile),
        );
        results.mixed_traffic[server.name.toLowerCase()] = extractMetrics(summary, code, cores);

        const m = results.mixed_traffic[server.name.toLowerCase()];
        console.log(
          `    ✅ ${server.name}: ${m.requests.rate} req/s (mixed) | p99 ${m.latency_ms.p99}ms | ${coresText(cores)}\n`,
        );
      } catch (err) {
        console.error(`    ❌ ${server.name}: ${err.message}\n`);
        results.mixed_traffic[server.name.toLowerCase()] = { error: err.message };
      } finally {
        proc.kill('SIGTERM');
        await sleep(COOLDOWN);
      }
    }
  }

  // ─── Step 4: Degradation Curve (full mode only) ──────
  if (IS_FULL) {
    console.log(`\n  ${'═'.repeat(58)}`);
    console.log('  📉 DEGRADATION CURVE — Finding the breaking point');
    console.log(`  ${'═'.repeat(58)}\n`);

    results.degradation = {};
    for (const server of SERVERS) {
      const proc = startServer(server);
      try {
        await waitForServer(server.port);
        await warmup(server.port, WARMUP_COUNT);
        await sleep(1000);

        const outputFile = path.join(tmpDir, `${server.name.toLowerCase()}-degradation.json`);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

        const k6Script = path.resolve(__dirname, '../k6/degradation.js');
        const healthQuery = '{ health { status adapter uptimeSeconds } }';
        const { summary, code, cores } = await withCpuCores(proc.pid, () =>
          runK6CustomWithQuery(k6Script, server.port, healthQuery, outputFile),
        );
        results.degradation[server.name.toLowerCase()] = extractMetrics(summary, code, cores);
        const m = results.degradation[server.name.toLowerCase()];
        console.log(
          `    ✅ ${server.name}: ${m.requests.rate} req/s avg | p99 ${m.latency_ms.p99}ms | max ${m.latency_ms.max}ms | ${coresText(cores)}\n`,
        );
      } catch (err) {
        console.error(`    ❌ ${server.name}: ${err.message}\n`);
        results.degradation[server.name.toLowerCase()] = { error: err.message };
      } finally {
        proc.kill('SIGTERM');
        await sleep(COOLDOWN);
      }
    }
  }

  // Step 5: Save results
  const outDir = path.resolve(__dirname, '../results');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outFile = path.join(outDir, `bench-${timestamp}.json`);
  fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outDir, 'latest.json'), JSON.stringify(results, null, 2));

  // Cleanup tmp
  try {
    fs.rmSync(tmpDir, { recursive: true });
  } catch {}

  // Step 4: Print summary
  console.log('\n\n  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║  RESULTS SUMMARY                                          ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');

  for (const sc of results.scenarios) {
    console.log(`  ${sc.name} [${sc.complexity}]:`);

    const serverNames = SERVERS.map((s) => s.name.toLowerCase());
    const serverData = serverNames.map((name) => sc.servers[name]);

    if (serverData.some((s) => s?.error)) {
      console.log('    (some servers errored, see results JSON)\n');
      continue;
    }

    const baseRate = serverData[0]?.requests?.rate || 0;
    const maxLenName = Math.max(...SERVERS.map((s) => s.name.length));

    for (let i = 0; i < SERVERS.length; i++) {
      const s = serverData[i];
      if (!s) continue;

      const name = SERVERS[i].name.padEnd(maxLenName);
      const rate = s.requests.rate;
      const pass = s.thresholds_passed ? 'PASS' : 'FAIL';
      const delta =
        i === 0
          ? ''
          : `  (${(((rate - baseRate) / baseRate) * 100).toFixed(0) > 0 ? '+' : ''}${(((rate - baseRate) / baseRate) * 100).toFixed(0)}%)`;
      console.log(
        `    ${name}:   ${rate} req/s  avg ${s.latency_ms.avg}ms  p99 ${s.latency_ms.p99}ms  ${coresText(s.cpu_cores)}  ${pass}${delta}`,
      );
    }
  }

  console.log(`  📁 Results: results/latest.json`);
  console.log(`  📁 Copy:    ${path.basename(outFile)}\n`);
}

main().catch((err) => {
  for (const server of ALL_SERVERS) {
    try {
      execSync(`kill -9 $(lsof -ti:${server.port}) 2>/dev/null`, { stdio: 'ignore' });
    } catch {}
  }

  console.error('Fatal error:', err);
  process.exit(1);
});

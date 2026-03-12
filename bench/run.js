#!/usr/bin/env node

// HOW THIS WORKS:
//
// 1. Build TypeScript
// 2. For each server (one at a time, never parallel):
//    a. Start the server
//    b. Warm it up (throwaway requests)
//    c. For each scenario:
//       - Run k6 with the GraphQL query
//       - k6 ramps up users gradually, holds load, ramps down
//       - k6 validates every response (not just HTTP 200)
//       - k6 exports detailed metrics JSON
//    d. Kill the server
//    e. Wait (let CPU cool)
// 3. Save all results to results/latest.json
//
// REQUIRES: k6 installed (brew install k6 / snap install k6)

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

console.log(`\n  Mode: ${IS_QUICK ? 'QUICK (~3 min)' : 'STANDARD (~20 min)'}`);
console.log(`  Profile: ${PROFILE}`);
console.log(`  Tool: k6 (${execSync('k6 version', { encoding: 'utf-8' }).trim()})\n`);

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

const SERVERS = [
  {
    name: 'Express',
    port: 3001,
    entry: '../servers/node/dist/main-express.js',
    env: { ADAPTER: 'express' },
  },
  {
    name: 'Fastify',
    port: 3002,
    entry: '../servers/node/dist/main-fastify.js',
    env: { ADAPTER: 'fastify' },
  },
  {
    name: 'Mercurius',
    port: 3003,
    entry: '../servers/node/dist/main-mercurius.js',
    env: { ADAPTER: 'merucrius' },
  },
  // Future: add Go, C#, Java here
  // { name: 'Go-Chi',  port: 3004, entry: '../servers/go/bin/chi',   env: { ADAPTER: 'go-chi' } },
];

// ─── Helpers ───────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function startServer(entry, port, env) {
  const child = spawn('node', [path.resolve(__dirname, entry)], {
    env: { ...process.env, PORT: String(port), ...env },
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
      const res = await fetch(`http://localhost:${port}/graphql`, {
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
  for (let i = 0; Math.ceil(count / batch); i++) {
    await Promise.all(
      Array.from({ length: batch }, () =>
        fetch(`http://localhost:${port}/graphql`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
        }),
      ),
    );
  }
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
        '--env',
        `SERVER=${serverUrl}`,
        '--env',
        `QUERY=${query}`,
        '--env',
        `PROFILE=${profile}`,
        '--quite',
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
        '--env',
        `SERVER=http://localhost:${port}`,
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
        '--env',
        `SERVER=http://localhost:${port}`,
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
function extractMetrics(summary, k6ExitCode) {
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
      http_failure_rate: +(failed.rate || 0).toFixed(4),
      graphql_error_rate: +(gqlErr.rate || 0).toFixed(4),
      valid_response_rate: +(gqlOk.rate || 0).toFixed(4),
    },
    response_size_bytes: {
      avg: +(size.avg || 0).toFixed(0),
    },
    thresholds, // pass/fail per threshold
    thresholds_passed: k6ExitCode === 0, // all thresholds passed?
  };
}

// ─── Main ──────────────────────────────────────────────

async function main() {
  console.log('  ╔═══════════════════════════════════════════════════════════╗');
  console.log('  ║  NestJS GraphQL Benchmark (k6)                            ║');
  console.log('  ║  Express+Apollo vs Fastify+Apollo vs Fastify+Mercurius    ║');
  console.log('  ╚═══════════════════════════════════════════════════════════╝\n');

  // Step 1: Build TypeScript (Node servers)
  console.log('  📦 Building Node.js servers...');
  try {
    execSync('npx nest build', {
      cwd: path.resolve(__dirname, '../servers/node'),
      stdio: 'inherit',
    });
  } catch {
    console.error('  ❌ Build failed. Run "cd servers/node && npm install" first.');
    process.exit(1);
  }
  console.log('  ✅ Build complete\n');

  // ─── Pre-flight: Cold Start & Response Size Verification ──
  const { measureColdStart, measureResponseSizes } = require('./preflight');
  const IS_FULL = !IS_QUICK;
  const preflight = { cold_starts: {}, response_sizes: {} };

  if (IS_FULL) {
    console.log('  ─── PREFLIGHT CHECKS ───────────────────────────────\n');

    // Cold start times
    console.log('  🕐 Measuring cold start times...');
    for (const server of SERVERS) {
      const ms = await measureColdStart(server.entry, server.port, server.env);
      preflight.cold_starts[server.name.toLowerCase()] = ms;
      console.log(`    ${server.name}: ${ms}ms to first response`);
    }
    console.log('');

    // Response size verification (start Express to measure, it's representative)
    console.log('  📏 Verifying response sizes match across servers...');
    for (const server of SERVERS) {
      const proc = startServer(server.entry, server.port, server.env);
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
    if (serverNames.length >= 2) {
      const first = preflight.response_sizes[serverNames[0]];
      let allMatch = true;
      for (let i = 1; i < serverNames.length; i++) {
        const other = preflight.response_sizes[serverNames[i]];
        for (const qid of Object.keys(first)) {
          const diff = Math.abs((first[qid]?.bytes || 0) - (other[qid]?.bytes || 0));
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
    const proc = startServer(server.entry, server.port, server.env);

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
          const { summary, code } = await runK6(
            `http://localhost${server.port}`,
            scenario.query,
            PROFILE,
            outputFile,
          );

          const metrics = extractMetrics(summary, code);

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
            `             ${pass} | ${metrics.requests.rate} req/s | avg ${metrics.latency_ms.avg}ms | p99 ${metrics.latency_ms.p99}ms\n`,
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
      const proc = startServer(server.entry, server.port, server.env);
      try {
        await waitForServer(server.port);
        await warmup(server.port, WARMUP_COUNT);
        await sleep(1000);

        const outputFile = path.join(tmpDir, `${server.name.toLowerCase()}-mixed.json`);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

        const k6Script = path.resolve(__dirname, '../k6/mixed-traffic.js');
        const { summary, code } = runK6Custom(k6Script, server.port, PROFILE, outputFile);
        results.mixed_traffic[server.name.toLowerCase()] = extractMetrics(summary, code);

        const m = results.mixed_traffic[server.name.toLowerCase()];
        console.log(
          `    ✅ ${server.name}: ${m.requests.rate} req/s (mixed) | p99 ${m.latency_ms.p99}ms\n`,
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
      const proc = startServer(server.entry, server.port, server.env);
      try {
        await waitForServer(server.port);
        await warmup(server.port, WARMUP_COUNT);
        await sleep(1000);

        const outputFile = path.join(tmpDir, `${server.name.toLowerCase()}-degradation.json`);
        if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);

        const k6Script = path.resolve(__dirname, '../k6/degradation.js');
        const healthQuery = '{ health { status adapter uptimeSeconds } }';
        const { summary, code } = await runK6CustomWithQuery(
          k6Script,
          server.port,
          healthQuery,
          outputFile,
        );
        results.degradation[server.name.toLowerCase()] = extractMetrics(summary, code);
        const m = results.degradation[server.name.toLowerCase()];
        console.log(
          `    ✅ ${server.name}: ${m.requests.rate} req/s avg | p99 ${m.latency_ms.p99}ms | max ${m.latency_ms.max}ms\n`,
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

    const e = sc.servers.express;
    const f = sc.servers.fastify;
    const m = sc.servers.mercurius;

    if (e?.error || f?.error || m?.error) {
      console.log('    (some servers errored, see results JSON)\n');
      continue;
    }

    const eRate = e.requests.rate;
    const fRate = f.requests.rate;
    const mRate = m.requests.rate;
    const fDelta = (((fRate - eRate) / eRate) * 100).toFixed(0);
    const mDelta = (((mRate - eRate) / eRate) * 100).toFixed(0);

    console.log(
      `    Express:   ${eRate} req/s  avg ${e.latency_ms.avg}ms  p99 ${e.latency_ms.p99}ms  ${e.thresholds_passed ? 'PASS' : 'FAIL'}`,
    );
    console.log(
      `    Fastify:   ${fRate} req/s  avg ${f.latency_ms.avg}ms  p99 ${f.latency_ms.p99}ms  ${f.thresholds_passed ? 'PASS' : 'FAIL'}  (${fDelta > 0 ? '+' : ''}${fDelta}%)`,
    );
    console.log(
      `    Mercurius: ${mRate} req/s  avg ${m.latency_ms.avg}ms  p99 ${m.latency_ms.p99}ms  ${m.thresholds_passed ? 'PASS' : 'FAIL'}  (${mDelta > 0 ? '+' : ''}${mDelta}%)`,
    );
    console.log('');
  }

  console.log(`  📁 Results: results/latest.json`);
  console.log(`  📁 Copy:    ${path.basename(outFile)}\n`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

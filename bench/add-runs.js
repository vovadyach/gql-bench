#!/usr/bin/env node
// Add servers measured later (runs made with --only) to an existing combined result
// file, e.g. a new language next to the published Node.js medians.
// Every metric of the added servers is the median across the runs (same rules as
// merge-runs.js --median). Servers the runs share with the base file are a check:
// they are compared with the base, not written, to show the machine still performs the same.
//
//   node bench/add-runs.js --add=python base.json run1.json run2.json [...]

const fs = require('fs');

const args = process.argv.slice(2);
const add = args
  .find((a) => a.startsWith('--add='))
  ?.slice('--add='.length)
  .toLowerCase();
const [baseFile, ...inputs] = args.filter((a) => !a.startsWith('--'));
if (!add || !baseFile || inputs.length < 2) {
  console.error(
    'usage: node bench/add-runs.js --add=<name> <base.json> <run1.json> <run2.json> [...]',
  );
  process.exit(1);
}

const base = JSON.parse(fs.readFileSync(baseFile, 'utf-8'));
const runs = inputs.map((f) => JSON.parse(fs.readFileSync(f, 'utf-8')));
const last = runs[runs.length - 1];

runs.forEach((run, i) => {
  if (run.meta.profile !== base.meta.profile || run.meta.cpu_model !== base.meta.cpu_model) {
    console.error(
      `${inputs[i]} is ${run.meta.profile} on ${run.meta.cpu_model}, ` +
        `but ${baseFile} is ${base.meta.profile} on ${base.meta.cpu_model}`,
    );
    process.exit(1);
  }
});

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Median of numbers, AND of booleans, first value otherwise; recurses through objects
function combine(values) {
  const [first] = values;
  if (typeof first === 'number') {
    return +median(values).toFixed(values.every(Number.isInteger) ? 0 : 4);
  }
  if (typeof first === 'boolean') return values.every(Boolean);
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    return Object.fromEntries(
      Object.keys(first).map((k) => [k, combine(values.map((v) => v?.[k]))]),
    );
  }
  return first;
}

const scenarioOf = (run, id) => {
  const scenario = run.scenarios.find((s) => s.id === id);
  if (!scenario) {
    console.error(`A run has no "${id}" scenario`);
    process.exit(1);
  }
  return scenario;
};

const measured = Object.keys(last.scenarios[0].servers);
const added = measured.filter((k) => k.includes(add));
const checks = measured.filter((k) => !k.includes(add) && base.scenarios[0].servers[k]);
if (!added.length) {
  console.error(`--add=${add} matched none of the servers in the runs: ${measured.join(', ')}`);
  process.exit(1);
}

// One value per run for an added server; a run where it failed stops everything
function medianOf(key, label, get) {
  const values = runs.map(get);
  if (values.some((v) => !v || v.error)) {
    console.error(`${key} has no result or an error in ${label} in at least one run`);
    process.exit(1);
  }
  return combine(values);
}

for (const scenario of base.scenarios) {
  for (const key of added) {
    scenario.servers[key] = medianOf(
      key,
      scenario.id,
      (r) => scenarioOf(r, scenario.id).servers[key],
    );
  }
}
// Mixed traffic, degradation and preflight exist in standard runs only
for (const section of ['mixed_traffic', 'degradation']) {
  if (!base[section]) continue;
  for (const key of added) base[section][key] = medianOf(key, section, (r) => r[section]?.[key]);
}
for (const part of ['cold_starts', 'response_sizes']) {
  for (const key of added) {
    if (last.preflight?.[part]?.[key] === undefined) continue;
    base.preflight[part][key] = medianOf(key, part, (r) => r.preflight[part][key]);
  }
}

// Response sizes must fall within the range of the servers already in the base, give or
// take run.js's 10 bytes (random values alone spread those servers by up to ~15 bytes).
// health echoes each server's ADAPTER, which equals its key, so its length is discounted
const sizes = base.preflight.response_sizes;
for (const key of added.filter((k) => sizes[k])) {
  for (const [qid, info] of Object.entries(sizes[key])) {
    const others = Object.entries(sizes)
      .filter(([k, s]) => !added.includes(k) && s[qid])
      .map(([k, s]) => s[qid].bytes - (qid === 'health' ? k.length : 0));
    if (!others.length) continue;
    const bytes = info.bytes - (qid === 'health' ? key.length : 0);
    const [lo, hi] = [Math.min(...others), Math.max(...others)];
    const ok = bytes >= lo - 10 && bytes <= hi + 10;
    console.log(
      `${ok ? '✅' : '⚠️ '} ${key} ${qid}: ${bytes} bytes, other servers ${lo}–${hi}` +
        (qid === 'health' ? ' (without the adapter name)' : ''),
    );
  }
}

// Check servers: median across the runs vs the base file
let maxDrift = 0;
for (const key of checks) {
  const rows = base.scenarios.map((scenario) => ({
    test: scenario.id,
    then: scenario.servers[key].requests.rate,
    now: median(runs.map((r) => scenarioOf(r, scenario.id).servers[key].requests.rate)),
  }));
  if (base.mixed_traffic?.[key] && last.mixed_traffic?.[key]) {
    rows.push({
      test: 'mixed traffic',
      then: base.mixed_traffic[key].requests.rate,
      now: median(runs.map((r) => r.mixed_traffic[key].requests.rate)),
    });
  }
  console.log(`\nCheck: ${key}, req/s in the base file vs now`);
  for (const { test, then, now } of rows) {
    const pct = (now / then - 1) * 100;
    maxDrift = Math.max(maxDrift, Math.abs(pct));
    console.log(
      `  ${test.padEnd(14)} ${String(then).padStart(10)} ${String(+now.toFixed(2)).padStart(10)}  ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`,
    );
  }
}

// Meta: runtime versions the base lacks, new methodology lines, and where the added numbers come from
for (const [k, v] of Object.entries(last.meta)) {
  if (!k.endsWith('_version')) continue;
  if (!(k in base.meta)) base.meta[k] = v;
  else if (base.meta[k] !== v)
    console.log(`\nNote: ${k} is ${v} in the runs, ${base.meta[k]} in the base`);
}
const name = add === 'csharp' ? 'C#' : add[0].toUpperCase() + add.slice(1); // python -> Python
const note =
  `${name} measured separately: median of ${runs.length} runs on the same machine` +
  (checks.length
    ? `; ${checks.join(', ')}, re-run alongside, stayed within ${Math.ceil(maxDrift)}% of the numbers here`
    : '');
const newLines = last.meta.methodology.filter((l) => !base.meta.methodology.includes(l));
base.meta.methodology = [
  ...base.meta.methodology.filter((l) => !l.startsWith(`${name} measured separately`)),
  ...newLines,
  note,
];
base.meta.added = [
  ...(base.meta.added || []).filter((a) => !a.servers.some((k) => added.includes(k))),
  { servers: added, runs: runs.map((r) => r.meta.date), check: checks },
];

fs.writeFileSync(baseFile, JSON.stringify(base, null, 2));
console.log(
  `\nAdded ${added.join(', ')} (median of ${runs.length} ${base.meta.profile} runs) -> ${baseFile}`,
);

#!/usr/bin/env node
// Combine several benchmark result files of the same profile into one.
// Every numeric metric is the mean (default) or median (--median) across runs;
// meta comes from the last run.
//
//   node bench/merge-runs.js [--median] out.json run1.json run2.json [...]

const fs = require('fs');

const args = process.argv.slice(2);
const useMedian = args.includes('--median');
const [out, ...inputs] = args.filter((a) => a !== '--median');
if (!out || inputs.length < 2) {
  console.error(
    'usage: node bench/merge-runs.js [--median] <out.json> <run1.json> <run2.json> [...]',
  );
  process.exit(1);
}

const runs = inputs.map((f) => JSON.parse(fs.readFileSync(f, 'utf-8')));
if (new Set(runs.map((r) => r.meta.profile)).size > 1) {
  console.error('All runs must use the same profile (quick or standard)');
  process.exit(1);
}

function center(numbers) {
  if (!useMedian) return numbers.reduce((sum, v) => sum + v, 0) / numbers.length;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Mean/median of numbers, AND of booleans, first value otherwise; recurses through objects
function combine(values) {
  const [first] = values;
  if (typeof first === 'number') {
    return +center(values).toFixed(values.every(Number.isInteger) ? 0 : 4);
  }
  if (typeof first === 'boolean') return values.every(Boolean);
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    return Object.fromEntries(
      Object.keys(first).map((k) => [k, combine(values.map((v) => v?.[k]))]),
    );
  }
  return first;
}

const how = useMedian ? 'median' : 'mean';
const last = runs[runs.length - 1];
const merged = {
  meta: {
    ...last.meta,
    runs: runs.map((r) => r.meta.date),
    methodology: [
      ...last.meta.methodology,
      `${useMedian ? 'Median' : 'Average'} of ${runs.length} full runs (every metric is the ${how} across runs)`,
    ],
  },
  preflight: combine(runs.map((r) => r.preflight)),
  scenarios: last.scenarios.map((s) => ({
    ...s,
    servers: combine(runs.map((r) => r.scenarios.find((x) => x.id === s.id).servers)),
  })),
  mixed_traffic: last.mixed_traffic ? combine(runs.map((r) => r.mixed_traffic)) : null,
  degradation: last.degradation ? combine(runs.map((r) => r.degradation)) : null,
};

fs.writeFileSync(out, JSON.stringify(merged, null, 2));
console.log(`Combined ${runs.length} ${last.meta.profile} runs (${how}) -> ${out}`);

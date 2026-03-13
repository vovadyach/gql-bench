// Server configuration (colors, labels)
export interface ServerConfig {
  key: string;
  label: string; // "Express + Apollo"
  short: string; // "Express"
  color: string; // "#ff4757"
  glow: string; // "rgba(255,71,87,.10)"
}

// Result from one server on one scenario
export interface ServerResult {
  rate: number; // requests per second
  avg: number; // average latency ms
  med: number; // median (p50) ms
  p90: number;
  p95: number;
  p99: number;
  max: number;
  total: number; // total requests sent
}

// One benchmark scenario
export interface Scenario {
  id: string; // "health"
  name: string; // "Health Check"
  complexity: 'light' | 'medium' | 'heavy' | 'extreme';
  servers: Record<string, ServerResult>;
}

// Machine info
export interface BenchmarkMeta {
  date: string;
  tool: string;
  profile: string;
  warmup_requests: number;
  node_version: string;
  platform: string;
  arch: string;
  cpus: number;
  cpu_model: string;
  memory_gb: number;
  methodology: string[];
}

// The full JSON structure from results/latest.json
export interface BenchmarkData {
  meta: BenchmarkMeta;
  scenarios: Scenario[];
}

// Theme colors
export interface Theme {
  bg: string;
  panel: string;
  border: string;
  borderHi: string;
  text: string;
  bright: string;
  sec: string;
  ter: string;
  grid: string;
  axis: string;
  shd: string;
  grad: string;
  scr: string;
}

// Key finding card
export interface Finding {
  icon: string;
  title: string;
  desc: string;
  color: string;
}

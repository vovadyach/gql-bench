// Server configuration (colors, labels)
import { JSX } from 'react';

export interface ServerConfig {
  key: string;
  label: string; // "Express + Apollo"
  short: string; // "Express"
  color: string; // "#ff4757"
  glow: string; // "rgba(255,71,87,.10)"
}

// Result from one server on one scenario
export interface ServerResult {
  requests: {
    total: number;
    rate: number;
  };
  iterations: {
    total: number;
    rate: number;
  };
  response_size_bytes: {
    avg: number;
  };
  latency_ms: {
    avg: number;
    min: number;
    max: number;
    med: number;
    p90: number;
    p95: number;
    p99: number;
  };
  throughput: {
    received_mb: number;
    sent_mb: number;
  };
  errors: {
    http_failure_rate: number;
    graphql_error_rate: number;
    valid_response_rate: number;
  };
  thresholds: Record<string, boolean>;
  thresholds_passed: boolean;
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
  preflight: {
    cold_starts: Record<string, number>;
    response_sizes: Record<string, Record<string, { bytes: number; valid: boolean }>>;
  };
  scenarios: Scenario[];
  mixed_traffic: Record<string, ServerResult> | null;
  degradation: Record<string, ServerResult> | null;
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
  icon: string | any;
  title: string;
  desc: string;
  color: string;
}

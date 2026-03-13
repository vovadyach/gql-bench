'use client';

import BENCHMARK_DATA from '@/lib/data.json';
import { Header } from '@/components/layout/Header/Header';

export default function Page() {
  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <Header meta={BENCHMARK_DATA.meta} />
      <p className="text-muted-foreground">Rest of dashboard goes here...</p>
    </div>
  );
}

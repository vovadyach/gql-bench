'use client';

import BENCHMARK_DATA from '@/lib/data.json';
import { Header } from '@/components/layout/Header/Header';
import { ServerToggles } from '@/components/controls/ServerToggles/ServerToggles';
import { useVisibleServers } from '@/hooks/useVisibleServers';

export default function Page() {
  const { visible, toggle } = useVisibleServers();

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <Header meta={BENCHMARK_DATA.meta} />
      <ServerToggles visible={visible} onToggle={toggle} />
    </div>
  );
}

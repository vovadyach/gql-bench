'use client';

import { Header } from '@/components/layout/Header/Header';
import { ServerToggles } from '@/components/controls/ServerToggles/ServerToggles';
import { useVisibleServers } from '@/hooks/useVisibleServers';
import { HeroCards } from '@/components/charts/HeroCards/HeroCards';
import { BENCHMARK_DATA } from '@/lib/data';
import { FadeIn } from '@/components/shared/FadeIn/FadeIn';

export default function Page() {
  const { visible, toggle } = useVisibleServers();

  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-8">
      <div className="max-w-7xl mx-auto">
        <FadeIn delay={0}>
          <Header meta={BENCHMARK_DATA.meta} />
        </FadeIn>
        <FadeIn delay={100}>
          <ServerToggles visible={visible} onToggle={toggle} />
        </FadeIn>
        <FadeIn delay={200}>
          <HeroCards scenario={BENCHMARK_DATA.scenarios[0]} visible={visible} />
        </FadeIn>
      </div>
    </div>
  );
}

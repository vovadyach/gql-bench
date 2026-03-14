'use client';

import { Header } from '@/components/layout/Header/Header';
import { ServerToggles } from '@/components/controls/ServerToggles/ServerToggles';
import { useVisibleServers } from '@/hooks/useVisibleServers';
import { HeroCards } from '@/components/charts/HeroCards/HeroCards';
import { BENCHMARK_DATA } from '@/lib/data';
import { FadeIn } from '@/components/shared/FadeIn/FadeIn';
import { ScenarioPicker } from '@/components/controls/ScenarioPicker/ScenarioPicker';
import { useState } from 'react';
import { ThroughputChart } from '@/components/charts/ThroughputChart/ThroughputChart';
import { ScenarioCards } from '@/components/charts/ScenarioCards/ScenarioCards';

export default function Page() {
  const { visible, toggle } = useVisibleServers();
  const [activeScenario, setActiveScenario] = useState(0);

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
        <FadeIn delay={300}>
          <ThroughputChart scenarios={BENCHMARK_DATA.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={400}>
          <h2 className="text-sm font-bold mb-2">Scenario Deep Dive</h2>
          <ScenarioPicker
            scenarios={BENCHMARK_DATA.scenarios}
            active={activeScenario}
            onChange={setActiveScenario}
          />
        </FadeIn>
        <FadeIn delay={500}>
          <ScenarioCards scenario={BENCHMARK_DATA.scenarios[activeScenario]} visible={visible} />
        </FadeIn>
      </div>
    </div>
  );
}

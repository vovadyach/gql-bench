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
import { LatencyChart } from '@/components/charts/LatencyChart/LatencyChart';
import { P99AreaChart } from '@/components/charts/P99AreaChart/P99AreaChart';
import { PerformanceRadar } from '@/components/charts/PerformanceRadar/PerformanceRadarProps';
import { KeyFindings } from '@/components/sections/KeyFindings/KeyFindings';
import { generateFindings } from '@/lib/utils';
import { Footer } from '@/components/layout/Footer/Footer';
import { ComingSoon } from '@/components/sections/ComingSoon/ComingSoon';

export default function Page() {
  const { visible, toggle } = useVisibleServers();
  const [activeScenario, setActiveScenario] = useState(0);
  const findings = generateFindings(BENCHMARK_DATA.scenarios, visible);

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
        <FadeIn delay={600}>
          <LatencyChart scenario={BENCHMARK_DATA.scenarios[activeScenario]} visible={visible} />
        </FadeIn>
        <FadeIn delay={700}>
          <P99AreaChart scenarios={BENCHMARK_DATA.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={800}>
          <PerformanceRadar scenarios={BENCHMARK_DATA.scenarios} visible={visible} />
        </FadeIn>
        {findings.length && (
          <FadeIn delay={900}>
            <KeyFindings findings={findings} />
          </FadeIn>
        )}
        <FadeIn delay={1000}>
          <ComingSoon />
        </FadeIn>
        <FadeIn delay={1100}>
          <Footer meta={BENCHMARK_DATA.meta} />
        </FadeIn>
      </div>
    </div>
  );
}

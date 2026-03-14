'use client';

import { Header } from '@/components/layout/Header/Header';
import { ServerToggles } from '@/components/controls/ServerToggles/ServerToggles';
import { useVisibleServers } from '@/hooks/useVisibleServers';
import { HeroCards } from '@/components/charts/HeroCards/HeroCards';
import { BENCHMARK_DATA, PROFILES } from '@/lib/data';
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
import { RawDataTable } from '@/components/sections/RawDataTable/RawDataTable';
import { ProfileSelector } from '@/components/controls/ProfileSelector/ProfileSelector';

export default function Page() {
  const { visible, toggle } = useVisibleServers();
  const [activeScenario, setActiveScenario] = useState(0);
  const [profile, setProfile] = useState('quick');
  const data = PROFILES[profile];
  const findings = generateFindings(data.scenarios, visible);

  return (
    <div className="min-h-screen bg-background text-foreground py-8 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-5 lg:px-6">
        <div className="flex items-center gap-3 mb-6">
          <ProfileSelector
            active={profile}
            onChange={setProfile}
            profiles={Object.keys(PROFILES)}
          />
        </div>

        <FadeIn delay={0}>
          <Header meta={data.meta} />
        </FadeIn>
        <FadeIn delay={50}>
          <ServerToggles visible={visible} onToggle={toggle} />
        </FadeIn>
        <FadeIn delay={100}>
          <HeroCards scenario={data.scenarios[0]} visible={visible} />
        </FadeIn>
        <FadeIn delay={150}>
          <ThroughputChart scenarios={data.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={200}>
          <ScenarioPicker
            scenarios={data.scenarios}
            active={activeScenario}
            onChange={setActiveScenario}
          />
        </FadeIn>
        <FadeIn delay={250}>
          <ScenarioCards scenario={data.scenarios[activeScenario]} visible={visible} />
        </FadeIn>
        <FadeIn delay={300}>
          <LatencyChart scenario={data.scenarios[activeScenario]} visible={visible} />
        </FadeIn>
        <FadeIn delay={350}>
          <P99AreaChart scenarios={data.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={400}>
          <PerformanceRadar scenarios={data.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={450}>
          <KeyFindings findings={findings} />
        </FadeIn>
        <FadeIn delay={500}>
          <RawDataTable scenario={data.scenarios[0]} visible={visible} />
        </FadeIn>
        <FadeIn delay={550}>
          <ComingSoon />
        </FadeIn>
        <FadeIn delay={600}>
          <Footer meta={data.meta} />
        </FadeIn>
      </div>
    </div>
  );
}

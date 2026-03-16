'use client';

import { Header } from '@/components/layout/Header/Header';
import { ServerToggles } from '@/components/controls/ServerToggles/ServerToggles';
import { useVisibleServers } from '@/hooks/useVisibleServers';
import { HeroCards } from '@/components/charts/HeroCards/HeroCards';
import { PROFILES } from '@/lib/data';
import { FadeIn } from '@/components/shared/FadeIn/FadeIn';
import { ScenarioPicker } from '@/components/controls/ScenarioPicker/ScenarioPicker';
import { useMemo, useState } from 'react';
import { ThroughputChart } from '@/components/charts/ThroughputChart/ThroughputChart';
import { ScenarioCards } from '@/components/charts/ScenarioCards/ScenarioCards';
import { LatencyChart } from '@/components/charts/LatencyChart/LatencyChart';
import { generateFindings } from '@/lib/utils';
import { KeyFindings } from '@/components/sections/KeyFindings/KeyFindings';
import { ComingSoon } from '@/components/sections/ComingSoon/ComingSoon';
import { ProfileSelector } from '@/components/controls/ProfileSelector/ProfileSelector';
import { Footer } from '@/components/layout/Footer/Footer';
import dynamic from 'next/dynamic';
import { TableSkeleton } from '@/components/shared/TableSkeleton/TableSkeleton';
import { SectionSkeleton } from '@/components/shared/SectionSkeleton/SectionSkeleton';

const P99AreaChart = dynamic(() => import('@/components/charts/P99AreaChart/P99AreaChart'), {
  loading: () => <SectionSkeleton height="min-h-[320px]" />,
});
const PerformanceRadar = dynamic(
  () => import('@/components/charts/PerformanceRadar/PerformanceRadar'),
  {
    loading: () => <SectionSkeleton height="min-h-[420px]" />,
  },
);
const MixedTraffic = dynamic(() => import('@/components/charts/MixedTraffic/MixedTraffic'), {
  loading: () => <SectionSkeleton height="min-h-[220px]" />,
});
const Degradation = dynamic(() => import('@/components/charts/Degradation/Degradation'), {
  loading: () => <SectionSkeleton height="min-h-[240px]" />,
});
const RawDataTable = dynamic(() => import('@/components/sections/RawDataTable/RawDataTable'), {
  loading: () => <TableSkeleton />,
});

export default function Page() {
  const { visible, toggle } = useVisibleServers();
  const [activeScenario, setActiveScenario] = useState(0);
  const [profile, setProfile] = useState('quick');
  const data = PROFILES[profile];

  const activeScenarioData = useMemo(
    () => data.scenarios[activeScenario],
    [data.scenarios, activeScenario],
  );
  const findings = useMemo(
    () => generateFindings(data.scenarios, visible),
    [data.scenarios, visible],
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-8 overflow-x-hidden">
      <div className="mx-auto w-full max-w-[1240px] px-3 sm:px-5 lg:px-6">
        <FadeIn delay={0}>
          <div className="flex items-center gap-3 mb-6">
            <ProfileSelector
              active={profile}
              onChange={setProfile}
              profiles={Object.keys(PROFILES)}
            />
            <span className="text-xs text-muted-foreground">
              {profile === 'quick'
                ? '5 scenarios · 10 VUs · ~3 min'
                : '5 scenarios + mixed traffic + degradation · 50 VUs · ~30 min'}
            </span>
          </div>

          <Header meta={data.meta} />
        </FadeIn>
        <FadeIn delay={30}>
          <ServerToggles visible={visible} onToggle={toggle} />
        </FadeIn>
        <FadeIn delay={60}>
          <HeroCards scenario={data.scenarios[0]} visible={visible} />
        </FadeIn>
        <FadeIn delay={90}>
          <ThroughputChart scenarios={data.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={120}>
          <ScenarioPicker
            scenarios={data.scenarios}
            active={activeScenario}
            onChange={setActiveScenario}
          />
        </FadeIn>
        <FadeIn delay={150}>
          <ScenarioCards scenario={activeScenarioData} visible={visible} />
        </FadeIn>
        <FadeIn delay={180}>
          <LatencyChart scenario={activeScenarioData} visible={visible} />
        </FadeIn>
        <FadeIn delay={210}>
          <P99AreaChart scenarios={data.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={240}>
          <PerformanceRadar scenarios={data.scenarios} visible={visible} />
        </FadeIn>
        <FadeIn delay={270}>
          <MixedTraffic data={data.mixed_traffic} visible={visible} />
        </FadeIn>
        <FadeIn delay={300}>
          <Degradation data={data.degradation} visible={visible} />
        </FadeIn>
        <FadeIn delay={330}>
          <KeyFindings findings={findings} />
        </FadeIn>
        <FadeIn delay={360}>
          <RawDataTable scenario={data.scenarios[0]} visible={visible} />
        </FadeIn>
        <FadeIn delay={390}>
          <ComingSoon />
        </FadeIn>
        <FadeIn delay={410}>
          <Footer meta={data.meta} />
        </FadeIn>
      </div>
    </div>
  );
}

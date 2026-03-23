'use client';

import { FadeIn } from '@/components/shared/FadeIn/FadeIn';
import { ProfileSelector } from '@/components/controls/ProfileSelector/ProfileSelector';
import { PROFILES } from '@/lib/data';
import { Header } from '@/components/layout/Header/Header';
import { ServerToggles } from '@/components/controls/ServerToggles/ServerToggles';
import { HeroCards } from '@/components/charts/HeroCards/HeroCards';
import { ThroughputChart } from '@/components/charts/ThroughputChart/ThroughputChart';
import { ScenarioPicker } from '@/components/controls/ScenarioPicker/ScenarioPicker';
import { ScenarioCards } from '@/components/charts/ScenarioCards/ScenarioCards';
import { LatencyChart } from '@/components/charts/LatencyChart/LatencyChart';
import { KeyFindings } from '@/components/sections/KeyFindings/KeyFindings';
import { ComingSoon } from '@/components/sections/ComingSoon/ComingSoon';
import { Footer } from '@/components/layout/Footer/Footer';
import dynamic from 'next/dynamic';
import { TableSkeleton } from '@/components/shared/TableSkeleton/TableSkeleton';
import { useVisibleServers } from '@/hooks/useVisibleServers';
import { SetStateAction, useMemo, useState, useTransition } from 'react';
import { generateFindings } from '@/lib/utils';
import { LazySection } from '@/components/shared/LazySection/LazySection';

const P99AreaChart = dynamic(() => import('@/components/charts/P99AreaChart/P99AreaChart'));
const PerformanceRadar = dynamic(
  () => import('@/components/charts/PerformanceRadar/PerformanceRadar'),
);
const MixedTraffic = dynamic(() => import('@/components/charts/MixedTraffic/MixedTraffic'));
const Degradation = dynamic(() => import('@/components/charts/Degradation/Degradation'));
const RawDataTable = dynamic(() => import('@/components/sections/RawDataTable/RawDataTable'));

export function Dashboard() {
  const { visible, toggle } = useVisibleServers();
  const [activeScenario, setActiveScenario] = useState(0);
  const [profile, setProfile] = useState('quick');
  const data = PROFILES[profile];
  const [, startTransition] = useTransition();

  const activeScenarioData = useMemo(
    () => data.scenarios[activeScenario],
    [data.scenarios, activeScenario],
  );

  const findings = useMemo(
    () => generateFindings(data.scenarios, visible),
    [data.scenarios, visible],
  );

  function handleServerToggle(server: string) {
    startTransition(() => {
      toggle(server);
    });
  }

  function handleScenarioChange(index: number) {
    startTransition(() => {
      setActiveScenario(index);
    });
  }

  function handleProfileChange(newProfile: SetStateAction<string>) {
    startTransition(() => {
      setProfile(newProfile);
    });
  }

  return (
    <>
      <FadeIn>
        <div className="flex items-center gap-3 mb-6">
          <ProfileSelector
            active={profile}
            onChange={handleProfileChange}
            profiles={Object.keys(PROFILES)}
          />
          <span className="text-xs text-muted-foreground">
            {profile === 'quick'
              ? '5 scenarios · 10 VUs · ~3 min'
              : '5 scenarios + mixed traffic + degradation · 50 VUs · ~20 min'}
          </span>
        </div>

        <Header meta={data.meta} />
      </FadeIn>
      <FadeIn delay={50}>
        <ServerToggles visible={visible} onToggle={handleServerToggle} />
      </FadeIn>
      <FadeIn delay={250}>
        <HeroCards scenario={data.scenarios[0]} visible={visible} title="NestJS" />
      </FadeIn>
      <FadeIn delay={300}>
        <ThroughputChart scenarios={data.scenarios} visible={visible} />
      </FadeIn>
      <FadeIn delay={350}>
        <ScenarioPicker
          scenarios={data.scenarios}
          active={activeScenario}
          onChange={handleScenarioChange}
        />
      </FadeIn>
      <FadeIn delay={400}>
        <ScenarioCards scenario={activeScenarioData} visible={visible} />
      </FadeIn>
      <FadeIn delay={450}>
        <LatencyChart scenario={activeScenarioData} visible={visible} />
      </FadeIn>
      <LazySection>
        <P99AreaChart scenarios={data.scenarios} visible={visible} />
      </LazySection>
      <LazySection height="min-h-[420px]">
        <PerformanceRadar scenarios={data.scenarios} visible={visible} />
      </LazySection>
      <LazySection height="min-h-[220px]">
        <MixedTraffic data={data.mixed_traffic} visible={visible} />
      </LazySection>
      <LazySection height="min-h-[240px]">
        <Degradation data={data.degradation} visible={visible} />
      </LazySection>
      <LazySection>
        <KeyFindings findings={findings} />
      </LazySection>
      <LazySection skeleton={<TableSkeleton />}>
        <RawDataTable scenario={data.scenarios[0]} visible={visible} />
      </LazySection>
      <FadeIn>
        <ComingSoon />
      </FadeIn>
      <FadeIn>
        <Footer meta={data.meta} />
      </FadeIn>
    </>
  );
}

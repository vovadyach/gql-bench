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
import { CardGridSkeleton } from '@/components/shared/CardGridSkeleton/CardGridSkeleton';
import { TableSkeleton } from '@/components/shared/TableSkeleton/TableSkeleton';
import { useVisibleServers } from '@/hooks/useVisibleServers';
import { lazy, SetStateAction, useMemo, useState, useTransition } from 'react';
import { generateFindings } from '@/lib/utils';
import { LazySection } from '@/components/shared/LazySection/LazySection';
import { SERVERS } from '@/lib/constants';

const P99AreaChart = lazy(() => import('@/components/charts/P99AreaChart/P99AreaChart'));
const PerformanceRadar = lazy(
  () => import('@/components/charts/PerformanceRadar/PerformanceRadar'),
);
const MixedTraffic = lazy(() => import('@/components/charts/MixedTraffic/MixedTraffic'));
const Degradation = lazy(() => import('@/components/charts/Degradation/Degradation'));
const RawDataTable = lazy(() => import('@/components/sections/RawDataTable/RawDataTable'));

export function Dashboard() {
  const { visible, toggle } = useVisibleServers();
  const [activeScenario, setActiveScenario] = useState(0);
  const [profile, setProfile] = useState('standard');
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

  const nestjsServers = Object.entries(SERVERS).filter(([, s]) => s.tier === 'nestjs');
  const rawServers = Object.entries(SERVERS).filter(([, s]) => s.tier === 'raw');

  return (
    <>
      {/* Header paints at first paint (fast LCP); sections below wait for their counters */}
      <FadeIn immediate>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-6">
          <ProfileSelector
            active={profile}
            onChange={handleProfileChange}
            profiles={Object.keys(PROFILES)}
          />
          <span className="text-xs text-muted-foreground">
            {profile === 'quick'
              ? '5 scenarios · 10 VUs · ~16 min'
              : '5 scenarios + mixed traffic + degradation · 50 VUs · ~70 min'}
          </span>
        </div>

        <Header meta={data.meta} />
      </FadeIn>
      <FadeIn delay={50}>
        <ServerToggles visible={visible} onToggle={handleServerToggle} />
      </FadeIn>
      <FadeIn delay={250}>
        <HeroCards
          scenario={data.scenarios[0]}
          visible={visible}
          title="NestJS"
          servers={nestjsServers}
        />
      </FadeIn>
      <FadeIn delay={275}>
        <HeroCards
          scenario={data.scenarios[0]}
          visible={visible}
          title="Direct · without NestJS"
          servers={rawServers}
        />
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
      <LazySection height="min-h-[410px]">
        <PerformanceRadar scenarios={data.scenarios} visible={visible} />
      </LazySection>
      {data.mixed_traffic && (
        <LazySection
          skeleton={
            <CardGridSkeleton
              count={Object.keys(SERVERS).filter((key) => data.mixed_traffic?.[key]).length}
            />
          }
        >
          <MixedTraffic data={data.mixed_traffic} visible={visible} />
        </LazySection>
      )}
      {data.degradation && (
        <LazySection
          skeleton={
            <CardGridSkeleton
              count={Object.keys(SERVERS).filter((key) => data.degradation?.[key]).length}
              tall
            />
          }
        >
          <Degradation data={data.degradation} visible={visible} />
        </LazySection>
      )}
      <LazySection>
        <KeyFindings findings={findings} />
      </LazySection>
      <LazySection
        skeleton={
          <TableSkeleton
            rows={visible.filter((key) => activeScenarioData.servers[key]).length}
            groups={
              new Set(
                visible
                  .filter((key) => activeScenarioData.servers[key])
                  .map((key) => SERVERS[key].tier),
              ).size
            }
          />
        }
      >
        <RawDataTable scenario={activeScenarioData} visible={visible} />
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

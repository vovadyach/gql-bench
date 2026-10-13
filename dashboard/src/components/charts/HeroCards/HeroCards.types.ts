import { Scenario, ServerConfig } from '@/lib/types';

export interface HeroCardsProps {
  scenario: Scenario;
  visible: string[];
  title: string;
  servers: [string, ServerConfig][];
}

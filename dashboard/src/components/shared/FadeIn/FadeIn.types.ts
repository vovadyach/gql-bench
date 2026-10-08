import { ReactNode } from 'react';

export interface FadeInProps {
  children: ReactNode;
  delay?: number;
  // Start fading at first paint instead of waiting for hydration (no counters inside)
  immediate?: boolean;
}

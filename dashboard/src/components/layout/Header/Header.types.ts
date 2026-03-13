import { BenchmarkMeta } from '@/lib/types';

export interface HeaderProps {
  meta: BenchmarkMeta;
  dark: boolean;
  onThemeToggle: () => void;
  showMethodology: boolean;
  onMethodologyToggle: () => void;
}

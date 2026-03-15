import { ServerResult } from '@/lib/types';

export interface DegradationProps {
  data: Record<string, ServerResult> | null;
  visible: string[];
}

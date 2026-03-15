import { ServerResult } from '@/lib/types';

export interface MixedTrafficProps {
  data: Record<string, ServerResult> | null;
  visible: string[];
}

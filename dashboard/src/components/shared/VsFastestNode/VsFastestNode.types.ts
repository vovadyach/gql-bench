import { ServerResult } from '@/lib/types';

export interface VsFastestNodeProps {
  results: Record<string, ServerResult>;
  serverKey: string;
  className?: string;
}

import { ServerResult } from '@/lib/types';

export interface NestjsDeltaProps {
  results: Record<string, ServerResult>;
  serverKey: string;
  className?: string;
}

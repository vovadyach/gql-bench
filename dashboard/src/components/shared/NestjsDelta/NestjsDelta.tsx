import { SERVERS } from '@/lib/constants';
import { cn, formatSignedPct, nestjsDelta } from '@/lib/utils';
import type { NestjsDeltaProps } from './NestjsDelta.types';

// "+33% vs NestJS" on direct cards: the same stack with and without NestJS
// (other languages compare against the fastest Node server instead, see VsFastestNode)
export function NestjsDelta({ results, serverKey, className }: NestjsDeltaProps) {
  const tier = SERVERS[serverKey]?.tier;
  if (tier === 'nestjs' || tier === 'other') return null;
  const delta = nestjsDelta(results, serverKey);

  return (
    <p
      className={cn(
        'text-[11px]',
        delta === null ? 'text-muted-foreground' : 'font-semibold text-foreground',
        className,
      )}
      title={
        delta === null
          ? 'This stack has no NestJS version in the benchmark'
          : 'Same stack: req/s without NestJS vs with NestJS'
      }
    >
      {delta === null ? 'No NestJS version' : `${formatSignedPct(delta)} vs NestJS`}
    </p>
  );
}

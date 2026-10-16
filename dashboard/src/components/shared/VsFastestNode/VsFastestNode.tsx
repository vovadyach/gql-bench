import { SERVERS } from '@/lib/constants';
import { cn, fastestNode, formatNumber, formatRatio, serverName, vsFastestNode } from '@/lib/utils';
import type { VsFastestNodeProps } from './VsFastestNode.types';

// "20× slower than fastest Node" on other-language cards: the reference is the fastest Node
// server in the same results, named in the tooltip
export function VsFastestNode({ results, serverKey, className }: VsFastestNodeProps) {
  if (SERVERS[serverKey]?.tier !== 'other') return null;
  const ratio = vsFastestNode(results, serverKey);
  const fastest = fastestNode(results);
  if (ratio === null || !fastest) return null;

  const diff = formatRatio(ratio);

  return (
    <p
      className={cn('text-[11px] font-semibold text-foreground', className)}
      title={`Fastest Node server here: ${serverName(fastest.key)}, ${formatNumber(fastest.rate)} req/s`}
    >
      {diff.endsWith('%') ? `${diff} vs fastest Node` : `${diff} than fastest Node`}
    </p>
  );
}

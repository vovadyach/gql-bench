'use client';

import { SERVERS, TIER_LABELS } from '@/lib/constants';
import type { ServerTogglesProps } from './ServerToggles.types';
import { ScrollSnap } from '@/components/shared/ScrollSnap/ScrollSnap';

// One row per tier — labels repeat across tiers, so the row tells NestJS and Raw apart
const TIERS = [...new Set(Object.values(SERVERS).map((s) => s.tier))];

export function ServerToggles({ visible, onToggle }: ServerTogglesProps) {
  return (
    <div className="mb-6 space-y-2">
      {TIERS.map((tier) => (
        <div key={tier} className="flex items-center gap-3">
          <span className="w-14 shrink-0 text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
            {TIER_LABELS[tier]}
          </span>
          <div className="min-w-0 flex-1">
            <ScrollSnap className="flex gap-2 pb-2">
              {Object.entries(SERVERS)
                .filter(([, server]) => server.tier === tier)
                .map(([key, server]) => {
                  const isOn = visible.includes(key);
                  return (
                    <button
                      key={key}
                      onClick={() => onToggle(key)}
                      className="snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer"
                      style={{
                        borderColor: isOn ? `var(--server-${key})` : 'var(--border)',
                        borderStyle: server.tier === 'nestjs' ? 'solid' : 'dashed',
                        backgroundColor: isOn
                          ? `color-mix(in srgb, var(--server-${key}) 10%, transparent)`
                          : 'transparent',
                        opacity: isOn ? 1 : 0.8,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{
                          backgroundColor: isOn ? `var(--server-${key})` : 'var(--border)',
                          boxShadow: isOn ? `0 0 6px var(--server-${key})` : 'none',
                        }}
                      />
                      <span
                        style={{ color: isOn ? `var(--server-${key})` : 'var(--muted-foreground)' }}
                      >
                        {server.label}
                      </span>
                    </button>
                  );
                })}
            </ScrollSnap>
          </div>
        </div>
      ))}
    </div>
  );
}

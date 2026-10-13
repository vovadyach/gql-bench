'use client';

import { SERVERS, TIER_LABELS } from '@/lib/constants';
import type { ServerTogglesProps } from './ServerToggles.types';
import { ScrollSnap } from '@/components/shared/ScrollSnap/ScrollSnap';

// One row per tier — labels repeat across tiers, so the row tells NestJS and Direct apart;
// the row label toggles the whole tier
const TIERS = [...new Set(Object.values(SERVERS).map((s) => s.tier))];

const FOCUS_RING =
  'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

export function ServerToggles({ visible, onToggle, onToggleTier }: ServerTogglesProps) {
  return (
    <div className="mb-6 space-y-2">
      {TIERS.map((tier) => {
        const keys = Object.keys(SERVERS).filter((k) => SERVERS[k].tier === tier);
        const allOn = keys.every((k) => visible.includes(k));
        return (
          <div key={tier} className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onToggleTier(keys)}
              aria-pressed={allOn}
              title={allOn ? `Hide all ${TIER_LABELS[tier]}` : `Show all ${TIER_LABELS[tier]}`}
              className={`w-14 shrink-0 rounded text-left text-[10px] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground cursor-pointer ${FOCUS_RING}`}
            >
              {TIER_LABELS[tier]}
            </button>
            <div className="min-w-0 flex-1">
              <ScrollSnap className="flex gap-2 pb-2">
                {Object.entries(SERVERS)
                  .filter(([, server]) => server.tier === tier)
                  .map(([key, server]) => {
                    const isOn = visible.includes(key);
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => onToggle(key)}
                        aria-pressed={isOn}
                        className={`snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold cursor-pointer ${FOCUS_RING}`}
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
                          style={{
                            color: isOn ? `var(--server-${key})` : 'var(--muted-foreground)',
                          }}
                        >
                          {server.label}
                        </span>
                      </button>
                    );
                  })}
              </ScrollSnap>
            </div>
          </div>
        );
      })}
    </div>
  );
}

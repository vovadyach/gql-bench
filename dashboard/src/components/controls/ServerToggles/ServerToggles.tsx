'use client';

import { SERVERS } from '@/lib/constants';
import type { ServerTogglesProps } from './ServerToggles.types';

export function ServerToggles({ visible, onToggle }: ServerTogglesProps) {
  return (
    <div className="flex gap-2 mb-6 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
      {Object.entries(SERVERS).map(([key, server]) => {
        const isOn = visible.includes(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className="snap-start shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer"
            style={{
              borderColor: isOn ? `var(--server-${key})` : 'var(--border)',
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
            <span style={{ color: isOn ? `var(--server-${key})` : 'var(--muted-foreground)' }}>
              {server.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

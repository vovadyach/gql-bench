'use client';

import { SERVERS } from '@/lib/constants';
import type { ServerTogglesProps } from './ServerToggles.types';

export function ServerToggles({ visible, onToggle }: ServerTogglesProps) {
  return (
    <div className="flex gap-2 flex-wrap mb6">
      {Object.entries(SERVERS).map(([key, server]) => {
        const isOn = visible.includes(key);
        return (
          <button
            key={key}
            onClick={() => onToggle(key)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold cursor-pointer shadow-none"
            style={{
              borderColor: isOn ? `var(--server-${key})` : 'var(--border)',
              backgroundColor: isOn
                ? `color-mix(in srgb, var(--server-${key}) 10%, transparent)`
                : 'transparent',
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
